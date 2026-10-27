import csv
import math
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from app.config import settings


class CatalogueRow:
    def __init__(
        self,
        task_id: int,
        task: str,
        task_category: str,
        desired_output: str,
        recommended_app: str,
        reason: str,
        first_tiny_action: str,
    ):
        self.task_id = int(task_id)
        self.task = task.strip()
        self.task_category = task_category.strip()
        self.desired_output = desired_output.strip()
        self.recommended_app = recommended_app.strip()
        self.reason = reason.strip()
        self.first_tiny_action = first_tiny_action.strip()

        # Build embedding text per docs/prd.md FR-4:
        # text built from task, desired_output and task_category (underscores replaced with spaces).
        category_clean = self.task_category.replace("_", " ")
        output_clean = self.desired_output.replace("_", " ")
        self.embedding_text = f"{self.task} {output_clean} {category_clean}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task": self.task,
            "task_category": self.task_category,
            "desired_output": self.desired_output,
            "recommended_app": self.recommended_app,
            "reason": self.reason,
            "first_tiny_action": self.first_tiny_action,
            "embedding_text": self.embedding_text,
        }


def _tokenize(text: str) -> List[str]:
    """Tokenize into lowercase words and character 3-grams for robust matching."""
    text = text.lower()
    words = re.findall(r"\b[a-z0-9]+\b", text)
    tokens = list(words)
    # Add character n-grams for typo and inflection tolerance
    for word in words:
        if len(word) >= 3:
            for i in range(len(word) - 2):
                tokens.append(f"__{word[i:i+3]}")
    return tokens


# Explicitly unsupported or out-of-catalogue domains per user decision 1 and docs/safety.md
UNSUPPORTED_DOMAINS = [
    r"\bcover\s+letter\b",
    r"\b(job\s+)?interview\b",
    r"\btax(es)?\b",
    r"\bwedding\b",
    r"\bdiet(\s+plan)?\b",
    r"\bflight(s)?\b",
    r"\bhotel\b",
    r"\bweather\b",
    r"\bjoke(s)?\b",
    r"\bmedical\s+advice\b",
    r"\blegal\s+advice\b",
]

# Common student & academic term expansions to enrich sparse catalogue matches
SYNONYM_EXPANSIONS: Dict[str, str] = {
    # Academic writing & assignments
    r"\bessays?\b": "research paper college assignment academic_writing",
    r"\bhomeworks?\b": "assignment college_assignment study",
    r"\bdissertations?\b": "research paper academic_writing thesis",
    r"\bthes[ie]s\b": "research paper academic_writing",
    r"\bliterature\s+reviews?\b": "research paper citations zotero",
    r"\bproofreads?\b": "formal project report research paper",
    r"\bparaphrase?\b": "college assignment research paper",
    
    # Presentations & Slides
    r"\bslides?\b": "presentation technical academic ppt powerpoint",
    r"\bdecks?\b": "presentation slides canva powerpoint",
    r"\bpowerpoints?\b": "presentation technical academic ppt",
    
    # Design & Media
    r"\bflyers?\b": "college event poster visual_design canva",
    r"\bbanners?\b": "college event poster visual_design canva",
    r"\bmockups?\b": "website app ui design figma",
    r"\bwireframes?\b": "website app ui design figma",
    
    # Coding & Development
    r"\bscripts?\b": "write edit code software_development vscode",
    r"\bprograms?\b": "write edit code software_development vscode",
    r"\bdebug(ging)?\b": "track fix software bugs github issues",
    r"\bsql\b": "database schema design test dbdiagram",
    r"\b(fast\s*api|backend|servers?|rest\s*api)\b": "write edit code software_development vscode test api endpoints",
    
    # Organization & Planning
    r"\btodo\b": "organize personal tasks todoist",
    r"\broutine\b": "organize personal tasks todoist",
    r"\bflashcards?\b": "create class notes study organization onenote",
    r"\brevision\b": "study organization notes xmind",
}


class VectorRetriever:
    def __init__(self, csv_path: Optional[Path] = None, similarity_threshold: float = 0.22):
        self.csv_path = csv_path or settings.KNOWLEDGE_BASE_PATH
        self.similarity_threshold = similarity_threshold
        self.rows: List[CatalogueRow] = []
        self.id_to_row: Dict[int, CatalogueRow] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self.doc_norms: List[float] = []
        self.idf: Dict[str, float] = {}
        self.is_indexed = False
        self.load_and_index()

    def is_unsupported_domain(self, query: str) -> bool:
        """Checks if the query is in explicitly unsupported domains (taxes, medical, legal, etc.)."""
        if not query or not query.strip():
            return False
        clean_query = query.strip().lower()
        for pattern in UNSUPPORTED_DOMAINS:
            if re.search(pattern, clean_query, flags=re.IGNORECASE):
                return True
        return False

    def load_and_index(self):
        """Loads data/knowledge_base.csv (utf-8-sig) and builds the vector index."""
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"Knowledge base CSV not found at: {self.csv_path}")

        self.rows = []
        self.id_to_row = {}

        with open(self.csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cat_row = CatalogueRow(
                    task_id=int(row["task_id"]),
                    task=row["task"],
                    task_category=row["task_category"],
                    desired_output=row["desired_output"],
                    recommended_app=row["recommended_app"],
                    reason=row["reason"],
                    first_tiny_action=row["first_tiny_action"],
                )
                self.rows.append(cat_row)
                self.id_to_row[cat_row.task_id] = cat_row

        # Build Term Frequencies and IDF
        n_docs = len(self.rows)
        doc_freq: Dict[str, int] = {}
        tokenized_docs: List[List[str]] = []

        for row in self.rows:
            tokens = _tokenize(row.embedding_text)
            tokenized_docs.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1

        self.idf = {t: math.log((n_docs + 1) / (df + 1)) + 1.0 for t, df in doc_freq.items()}

        # Build doc vectors and norms
        self.doc_vectors = []
        self.doc_norms = []
        for tokens in tokenized_docs:
            vec: Dict[str, float] = {}
            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1

            norm_sq = 0.0
            for t, count in tf.items():
                weight = (1 + math.log(count)) * self.idf.get(t, 1.0)
                vec[t] = weight
                norm_sq += weight * weight

            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            self.doc_vectors.append(vec)
            self.doc_norms.append(norm)

        self.is_indexed = True

    def retrieve(self, query: str, top_k: int = 3) -> Tuple[List[Dict[str, Any]], float]:
        """Retrieves top_k catalogue entries matching the query.

        Returns (matches, best_score).
        If best_score < similarity_threshold or query is out-of-scope/empty, returns empty list.
        """
        if not query or not query.strip():
            return [], 0.0

        clean_query = query.strip().lower()

        # Check for uncatalogued or out-of-scope domains
        for pattern in UNSUPPORTED_DOMAINS:
            if re.search(pattern, clean_query, flags=re.IGNORECASE):
                return [], 0.0

        # Expand common student synonyms for robust catalogue coverage
        expanded_query = query
        for pattern, expansion in SYNONYM_EXPANSIONS.items():
            if re.search(pattern, clean_query, flags=re.IGNORECASE):
                expanded_query += " " + expansion

        query_tokens = _tokenize(expanded_query)
        if not query_tokens:
            return [], 0.0


        # Query vector
        query_tf: Dict[str, int] = {}
        for t in query_tokens:
            query_tf[t] = query_tf.get(t, 0) + 1

        query_vec: Dict[str, float] = {}
        query_norm_sq = 0.0
        for t, count in query_tf.items():
            if t in self.idf:
                weight = (1 + math.log(count)) * self.idf[t]
                query_vec[t] = weight
                query_norm_sq += weight * weight

        query_norm = math.sqrt(query_norm_sq) if query_norm_sq > 0 else 1.0
        if query_norm_sq == 0:
            return [], 0.0

        # Cosine similarity against all docs
        scores: List[Tuple[float, int]] = []
        for idx, (doc_vec, doc_norm) in enumerate(zip(self.doc_vectors, self.doc_norms)):
            dot_product = sum(query_vec[t] * doc_vec[t] for t in query_vec if t in doc_vec)
            score = dot_product / (query_norm * doc_norm) if (query_norm * doc_norm) > 0 else 0.0
            scores.append((score, idx))

        scores.sort(key=lambda x: x[0], reverse=True)
        best_score = scores[0][0] if scores else 0.0

        # Filter against threshold
        if best_score < self.similarity_threshold:
            return [], best_score

        top_matches: List[Dict[str, Any]] = []
        for score, idx in scores[:top_k]:
            match_dict = self.rows[idx].to_dict()
            match_dict["score"] = round(score, 4)
            top_matches.append(match_dict)

        return top_matches, best_score


retriever = VectorRetriever()
