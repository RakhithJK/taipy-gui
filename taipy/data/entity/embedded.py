import json
from typing import Any, Dict, Optional

from taipy.data.data_source_entity import DataSourceEntity
from taipy.data.scope import Scope
from taipy.exceptions import MissingRequiredProperty


class EmbeddedDataSourceEntity(DataSourceEntity):
    __REQUIRED_PROPERTIES = ["data"]
    __TYPE = "embedded"

    def __init__(
        self, name: str, scope: Scope, id: Optional[str] = None, properties: Dict = {}
    ):
        if missing := set(self.__REQUIRED_PROPERTIES) - set(properties.keys()):
            raise MissingRequiredProperty(
                f"The following properties [{','.join(x for x in missing)}] "
                f"were not informed and are required"
            )
        super().__init__(name, scope, id, data=properties.get("data"))

    @classmethod
    def create(cls, name: str, scope: Scope, data: Any):
        return EmbeddedDataSourceEntity(name, scope, None, {"data": data})

    @classmethod
    def type(cls) -> str:
        return cls.__TYPE

    def preview(self):
        print(f"{self.properties.get('data')}", flush=True)

    def get(self, query=None):
        """
        Temporary function interface, will be remove
        """
        return self.properties.get("data")

    def write(self, data):
        """
        Temporary function interface, will be remove
        """
        self.properties["data"] = data

    @property
    def data(self):
        return self.properties.get("data")

    def to_json(self):
        return json.dumps(
            {
                "name": self.name,
                "type": "embedded",
                "scope": self.scope.name,
                "data": self.data,
            }
        )

    @staticmethod
    def from_json(data_source_dict):
        return EmbeddedDataSourceEntity.create(
            name=data_source_dict.get("name"),
            scope=Scope[data_source_dict.get("scope")],
            data=data_source_dict.get("data"),
        )