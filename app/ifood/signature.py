"""
Validação da assinatura do webhook do iFood (header X-IFood-Signature).

IMPORTANTE (conforme documentação oficial): a assinatura deve ser calculada
sobre o byte array BRUTO do corpo da request, antes de qualquer parse/transform.
Nunca faça json.loads() e depois re-serialize para validar — isso muda os bytes
e a assinatura não vai bater.
"""
import hmac
import hashlib


def validar_assinatura(client_secret: str, corpo_bruto: bytes, assinatura_recebida: str) -> bool:
    """
    Retorna True se `assinatura_recebida` (header X-IFood-Signature) confere
    com o HMAC-SHA256 do corpo bruto, usando o client_secret do aplicativo.
    """
    if not assinatura_recebida or not corpo_bruto:
        return False

    assinatura_esperada = hmac.new(
        client_secret.encode("utf-8"), corpo_bruto, hashlib.sha256
    ).hexdigest()

    # Comparação em tempo constante — evita timing attack
    return hmac.compare_digest(assinatura_esperada, assinatura_recebida)
