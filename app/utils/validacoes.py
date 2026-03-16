import re


def validar_cpf(cpf: str) -> bool:
    """Valida CPF com dígitos verificadores."""
    cpf = re.sub(r'\D', '', cpf)

    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    # Primeiro dígito
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    d1   = (soma * 10 % 11) % 10
    if d1 != int(cpf[9]):
        return False

    # Segundo dígito
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    d2   = (soma * 10 % 11) % 10
    if d2 != int(cpf[10]):
        return False

    return True


def validar_email(email: str) -> bool:
    """Valida formato de e-mail."""
    padrao = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(padrao, email.strip()))


def validar_telefone(telefone: str) -> bool:
    """
    Valida celular brasileiro.
    Aceita: (11) 91234-5678 / 11912345678 / +5511912345678
    """
    digits = re.sub(r'\D', '', telefone)

    # Remove DDI 55 se vier
    if digits.startswith('55') and len(digits) in (12, 13):
        digits = digits[2:]

    # DDD + 9 dígitos (celular) ou DDD + 8 dígitos (fixo)
    if len(digits) == 11:
        # celular: DDD + 9 + 8 dígitos
        return digits[2] == '9'
    if len(digits) == 10:
        # fixo: DDD + 8 dígitos
        return True

    return False


def limpar_cpf(cpf: str) -> str:
    """Remove formatação do CPF."""
    return re.sub(r'\D', '', cpf)


def limpar_telefone(tel: str) -> str:
    """Remove formatação do telefone."""
    digits = re.sub(r'\D', '', tel)
    if digits.startswith('55') and len(digits) in (12, 13):
        digits = digits[2:]
    return digits