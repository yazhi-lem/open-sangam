from typing import List, Optional
from pydantic import BaseModel, Field

class KaruElements(BaseModel):
    flora: List[str] = Field(description="Plants, trees, or flowers mentioned in the verse")
    fauna: List[str] = Field(description="Animals, birds, or insects mentioned in the verse")
    landscape: List[str] = Field(description="Geographical features like mountains, rivers, or fields")

class Scenario(BaseModel):
    speaker: str = Field(description="The persona speaking the verse (e.g., Thalaivi, Thozhi, Thalaivan)")
    addressee: str = Field(description="The person being spoken to")
    tinai: str = Field(description="The classical landscape or situation (Kurinji, Mullai, Marutam, Neytal, Palai, or Puram tinais)")
    uripporul: str = Field(description="The core emotional theme (e.g., union, separation, waiting)")
    karu: KaruElements = Field(description="The regional elements that form the backdrop of the poem")
    dramaticSituation: str = Field(description="A concise summary of the dramatic context")
    evidenceLines: List[int] = Field(description="The specific line numbers that provide the strongest evidence for this extraction")
