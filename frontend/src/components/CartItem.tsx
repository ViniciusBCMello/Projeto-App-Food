import { Button, Image } from 'react-bootstrap';
import Placeholder from "../assets/hamburg.png";

interface CartItemProps {
  item: {
    id: number;
    nome: string;
    preco: number;
    quantidade: number;
    imagem: string;
    descricao: string;
  };
  onIncrement: (id: number, currentQty: number) => void;
  onDecrement: (id: number, currentQty: number) => void;
}

const CartItem = ({ item, onIncrement, onDecrement }: CartItemProps) => {
  const preco = Number(item.preco) || 0;
  const quantidade = Number(item.quantidade) || 0;
  const subtotal = preco * quantidade;

  return (
    <tr>
      <td style={{ width: '60px' }} className="ps-3 py-3">
        <Image
          src={item.imagem}
          rounded
          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.src = Placeholder; }}
        />
      </td>
      <td>
        <div style={{ maxWidth: '200px' }}>
          <div className="fw-bold text-dark text-truncate" title={item.nome}>
            {item.nome}
          </div>
          <div
            className="text-muted small lh-sm"
            style={{
              fontSize: '0.8rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.4em'
            }}
            title={item.descricao}
          >
            {item.descricao || "Sem descrição."}
          </div>
        </div>
      </td>
      <td className="text-center">
        <div className="d-inline-flex align-items-center border rounded-pill bg-light p-1">
          <Button
            variant="light"
            size="sm"
            className="rounded-circle p-0"
            style={{ width: '24px', height: '24px', lineHeight: '1' }}
            onClick={() => onDecrement(item.id, quantidade)}
          >-</Button>
          <span className="mx-2 fw-bold">{quantidade}</span>
          <Button
            variant="light"
            size="sm"
            className="rounded-circle p-0 text-primary"
            style={{ width: '24px', height: '24px', lineHeight: '1' }}
            onClick={() => onIncrement(item.id, quantidade)}
          >+</Button>
        </div>
      </td>
      <td className="text-end pe-3 fw-bold text-dark">
        R$ {subtotal.toFixed(2)}
      </td>
    </tr>
  );
};

export default CartItem;