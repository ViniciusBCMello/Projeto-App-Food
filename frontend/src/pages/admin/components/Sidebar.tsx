import React from 'react';
import { Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
  return (
    <div
      className="d-flex flex-column flex-shrink-0 p-3 bg-light border-end"
      style={{ width: '280px', minHeight: '100vh' }}
    >
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
        {/* Você pode substituir por um logotipo ou ícone */}
        <span className="fs-4 fw-bold">Admin App</span>
      </a>

      <hr />

      <Nav variant="pills" className="flex-column mb-auto gap-2">
        <Nav.Item>
          <Nav.Link href="#dashboard" active>
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#pedidos" className="link-dark">
            Pedidos em Andamento
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#cardapio" className="link-dark">
            Gestão do Cardápio
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#clientes" className="link-dark">
            Clientes
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#configuracoes" className="link-dark">
            Configurações
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <hr />

      {/* Rodapé do menu - Área do Usuário/Logout */}
      <div className="mt-auto">
        <Nav.Link href="#perfil" className="d-flex align-items-center link-dark text-decoration-none">
          <img
            src="https://github.com/mdo.png"
            alt="Foto do usuário"
            width="32"
            height="32"
            className="rounded-circle me-2"
          />
          <strong>Meu Perfil</strong>
        </Nav.Link>
      </div>
    </div>
  );
};

export default Sidebar;
