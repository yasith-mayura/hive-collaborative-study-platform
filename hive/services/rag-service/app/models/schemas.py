from typing import List, Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class QueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(min_length=3, max_length=500)
    subjectCode: str
    chat_history: List[ChatMessage] = Field(
        default_factory=list,
        validation_alias=AliasChoices("chat_history", "chatHistory"),
        serialization_alias="chat_history",
    )
    userId: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    subjectCode: str
    is_out_of_syllabus: bool
    chunks_used: int


class IngestRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resourceId: str = Field(validation_alias=AliasChoices("resourceId", "resource_id"))
    subjectCode: str = Field(validation_alias=AliasChoices("subjectCode", "subject_id", "subjectId"))
    subjectName: str = Field(default="Unknown Subject", validation_alias=AliasChoices("subjectName", "subject_name"))
    s3Url: str = Field(validation_alias=AliasChoices("s3Url", "s3_url", "s3URL"))
    fileName: str = Field(default="document.pdf", validation_alias=AliasChoices("fileName", "file_name"))
    resourceType: str = Field(default="note", validation_alias=AliasChoices("resourceType", "resource_type"))
    uploadedBy: str = Field(default="system", validation_alias=AliasChoices("uploadedBy", "uploaded_by"))


class IngestResponse(BaseModel):
    success: bool
    resourceId: str
    subjectCode: str
    chunks_created: int
    message: str


class DeleteRequest(BaseModel):
    resourceId: str
