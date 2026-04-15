import React, { useState } from 'react';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { useNavigate } from 'react-router-dom';

import { useLogin, useCreateUser } from '../hooks/useLogin';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggle entre Login e Cadastro

  // Hooks do React Query
  const loginMutation = useLogin();
  const registerMutation = useCreateUser();

  // Estados dos campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Lógica de Login
      loginMutation.mutate(
        { email, senha: password },
        {
          onSuccess: () => navigate('/produtos'),
        }
      );
    } else {
      // Lógica de Cadastro (Cargo padrão: cliente)
      registerMutation.mutate(
        {
          nome,
          email,
          senha: password,
          telefone,
          cpf,
          cargo: 'cliente',
        },
        {
          onSuccess: () => {
            alert('Conta criada com sucesso! Faça login agora.');
            setIsLogin(true);
          },
        }
      );
    }
  };

  // Tratamento de erro unificado
  const currentError = isLogin ? loginMutation.error : registerMutation.error;
  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="container mt-5">
      <Form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 className="mb-4 text-center">{isLogin ? 'Login' : 'Criar Conta'}</h2>

        {currentError && (
          <Alert variant="danger">
            {currentError.response?.data?.erro ||
              currentError.response?.data?.mensagem ||
              'Ocorreu um erro inesperado.'}
          </Alert>
        )}

        {!isLogin && (
          <>
            <FloatingLabel label="Nome Completo" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </FloatingLabel>

            <FloatingLabel label="Telefone" className="mb-3">
              <Form.Control
                type="text"
                placeholder="(71) 99999-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </FloatingLabel>

            <FloatingLabel label="CPF" className="mb-3">
              <Form.Control
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </FloatingLabel>
          </>
        )}

        <FloatingLabel label="E-mail" className="mb-3">
          <Form.Control
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FloatingLabel>

        <FloatingLabel label="Senha" className="mb-3">
          <Form.Control
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FloatingLabel>

        <Button
          variant="primary"
          type="submit"
          disabled={isPending}
          className="w-100 mb-3"
        >
          {isPending
            ? 'Processando...'
            : (isLogin ? 'Entrar' : 'Cadastrar')}
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-decoration-none"
          >
            {isLogin
              ? 'Não tem uma conta? Cadastre-se'
              : 'Já possui conta? Faça Login'}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default Login;