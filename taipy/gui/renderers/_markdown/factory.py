from ..factory import Factory


class MarkdownFactory(Factory):
    @staticmethod
    def create_element(control_type: str, all_properties: str) -> str:
        # Create properties dict from all_properties
        property_pairs = Factory._PROPERTY_RE.findall(all_properties)
        properties = {property[0]: property[1] for property in property_pairs}
        builder = Factory.CONTROL_BUILDERS[control_type](control_type, properties)
        if builder:
            return builder.el
        else:
            return f"<|INVALID SYNTAX - Control is '{control_type}'|>"