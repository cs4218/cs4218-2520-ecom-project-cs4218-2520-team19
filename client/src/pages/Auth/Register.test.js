import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

jest.mock('axios');
jest.mock('react-hot-toast');

// Mock Layout to isolate Register.js away from the many "dependencies" in Header that is part of Layout
jest.mock('./../../components/Layout', () => {
    return ({ children, title, description, keywords, author }) => (
      <div>
        <span data-testid="title">{title}</span>
        <span data-testid="description">{description}</span>
        <span data-testid="keywords">{keywords}</span>
        <span data-testid="author">{author}</span>
        {children}
      </div>
      );
});

let res;

beforeEach(() => {
  res = {
    data: {
      success: null,
      message: '',
    }
  };
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<div data-testid="mockLoginPage">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
  fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
  fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Register Component', () => {
  it('should register the user successfully', async () => {
    res.data.success = true;
    axios.post.mockResolvedValueOnce(res);

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
    await waitFor(() => expect(screen.getByTestId('mockLoginPage')).toBeInTheDocument());
  });

  it('should display error message on failed registration', async () => {
    const error = new Error('User already exists');
    axios.post.mockRejectedValueOnce(error);

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(screen.queryByTestId('mockLoginPage')).not.toBeInTheDocument();
  });

  it('should display response message upon receiving unsuccessful response', async () => {
    res.data.success = false;
    res.data.message = 'invalid field given';
    axios.post.mockResolvedValueOnce(res);

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('invalid field given');
    expect(screen.queryByTestId('mockLoginPage')).not.toBeInTheDocument();
  })
});
