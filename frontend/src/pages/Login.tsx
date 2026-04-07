import { useState } from 'react';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { useNavigate } from 'react-router-dom';

import { useLogin } from '../hooks/useLogin';

function Login() {
  const { mutate, isPending, error } = useLogin();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    mutate({
      email,
      senha: password,
    });
    navigate('/produtos');
  };

  return (
    <Form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>

      <h2 className="mb-4">Login</h2>

      {error && (
        <Alert variant="danger">
          {error.response?.data?.erro || 'Login failed'}
        </Alert>
      )}

      <FloatingLabel
        controlId="floatingInput"
        label="Email address"
        className="mb-3"
      >
        <Form.Control
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FloatingLabel>

      <FloatingLabel
        controlId="floatingPassword"
        label="Password"
        className="mb-3"
      >
        <Form.Control
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FloatingLabel>

      <Button
        variant="primary"
        type="submit"
        disabled={isPending}
        className="w-100"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </Form>
  );
}

export default Login;