from langchain_huggingface import HuggingFaceEmbeddings

# Using your requested model
model_name = "sentence-transformers/multi-qa-distilbert-cos-v1"

embeddings = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs={'device': 'cpu'}
)