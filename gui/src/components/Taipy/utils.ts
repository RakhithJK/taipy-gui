export interface TaipyBaseProps {
    id: string;
    defaultvalue: string;
    tp_varname: string;
    className?: string;
    value: unknown;
}

export interface TaipyFieldProps extends TaipyBaseProps {
    dataType: string;
    value: string;
}

export interface TaipyInputProps extends TaipyBaseProps {
    type: string;
    actionName: string;
    value: string;
}