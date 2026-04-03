from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def process_pdf(file_path: str):
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    # Split into chunks of ~600 characters with overlap
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=100
    )
    
    return text_splitter.split_documents(pages)