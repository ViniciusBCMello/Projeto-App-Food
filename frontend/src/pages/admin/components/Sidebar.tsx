import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import {
  FaHouse, FaCartShopping, FaBook, FaUsers, FaGear,
  FaChartPie, FaArrowUp, FaArrowDown, FaArrowsUpDown, FaWallet,
  FaLock
} from 'react-icons/fa6';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
  return (
    <div
      className="d-flex flex-column flex-shrink-0 p-3 bg-light border-end"
      style={{ width: '280px', minHeight: '100vh' }}
    >
      <NavLink
        to="/admin/dashboard"
        className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none"
      >
        <span className="fs-4 fw-bold text-primary">🍔 Admin App</span>
      </NavLink>

      <hr />

      <Nav variant="pills" className="flex-column mb-auto gap-1">

        <Nav.Item>
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-dark'}`
            }
          >
            <FaHouse /> Dashboard
          </NavLink>
        </Nav.Item>

        <Nav.Item className="mt-3">
          <div className="nav-link link-dark fw-semibold small text-muted text-uppercase px-3">
            Financeiro
          </div>
        </Nav.Item>

        <Nav.Item>
          <NavLink
            to="/admin/financeiro"
            end
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-dark'}`
            }
          >
            <FaChartPie /> Visão Geral
          </NavLink>
        </Nav.Item>

        <Nav.Item className="ms-3">
          <NavLink
            to="/admin/financeiro/receitas"
            end
            className={({ isActive }) =>
              `nav-link small d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-secondary'}`
            }
          >
            <FaArrowUp size={12} /> Receitas
          </NavLink>
        </Nav.Item>

        <Nav.Item className="ms-3">
          <NavLink
            to="/admin/financeiro/despesas"
            end
            className={({ isActive }) =>
              `nav-link small d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-secondary'}`
            }
          >
            <FaArrowDown size={12} /> Despesas
          </NavLink>
        </Nav.Item>

        <Nav.Item className="ms-3">
          <NavLink
            to="/admin/financeiro/movimentos"
            end
            className={({ isActive }) =>
              `nav-link small d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-secondary'}`
            }
          >
            <FaArrowsUpDown size={12} /> Movimentações
          </NavLink>
        </Nav.Item>

        <Nav.Item className="ms-3">
          <NavLink
            to="/admin/financeiro/resumo"
            end
            className={({ isActive }) =>
              `nav-link small d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-secondary'}`
            }
          >
            <FaWallet size={12} /> Resumo
          </NavLink>
        </Nav.Item>

        <Nav.Item className="mt-3">
          <NavLink
            to="/admin/pedidos"
            end
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-dark'}`
            }
          >
            <FaCartShopping /> Pedidos em Andamento
          </NavLink>
        </Nav.Item>

        <Nav.Item>
          <NavLink
            to="/admin/cardapio"
            end
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-dark'}`
            }
          >
            <FaBook /> Gestão do Cardápio
          </NavLink>
        </Nav.Item>

        <Nav.Item>
          <NavLink
            to="/admin/clientes"
            end
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-dark'}`
            }
          >
            <FaUsers /> Clientes
          </NavLink>
        </Nav.Item>

        <Nav.Item>
          <NavLink
            to="/admin/configuracoes"
            end
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : 'link-dark'}`
            }
          >
            <FaGear /> Configurações
          </NavLink>
        </Nav.Item>
      </Nav>

      <hr />

      <div className="mt-auto">
        <NavLink
          to="/admin/perfil"
          className="nav-link d-flex align-items-center gap-2 p-2 rounded"
        >
          <img
            src="https://ui-avatars.com/api/?name=Admin+User&background=0D6EFD&color=fff&size=128"
            alt="Foto do usuário"
            width="32"
            height="32"
            className="rounded-circle"
          />
          <div className="flex-grow-1">
            <div className="fw-semibold small">Meu Perfil</div>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Administrador</small>
          </div>
          <FaLock className="text-muted" size={14} title="Configurações de conta" />
        </NavLink>
      </div>

      <style>{`
        .nav-link {
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          transition: all 0.2s ease;
          text-decoration: none !important;
        }
        .nav-link:hover {
          background-color: rgba(0,0,0,0.05);
        }
        .nav-link.active {
          background-color: #0d6efd !important;
          color: white !important;
        }
        .nav-link.link-secondary.active {
          background-color: #6c757d !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
