// Teo Kim Han, A0273551E
import React  from 'react';
import axios from 'axios';
import { useAuth, AuthProvider } from './auth';
import { render, fireEvent, screen } from '@testing-library/react';

const authUser = 'testUser123';
const authToken = 'testToken123';

const authStub = {
    user: authUser,
    token: authToken,
};

const TestChild = () => {
    const [auth, setAuth] = useAuth();

    const updateAuth = () => {
        setAuth(authStub);
    };
    
    return <div>
        <span data-testid='user'>{String(auth.user)}</span>
        <span data-testid='token'>{auth.token}</span>
        <button onClick={updateAuth}>updateAuth</button>
        </div>
};

describe('Testing auth state', () => {
    beforeEach(() => {
        render(
            <AuthProvider>
                <TestChild />
            </AuthProvider>
        );
    });
    
    it('should initially have null user and empty token', () => {
        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(screen.getByTestId('token').textContent).toBe('');
    });
    
    it('should change when set', () => {
      fireEvent.click(screen.getByText('updateAuth'));
    
      expect(screen.getByTestId('user').textContent).toBe(authUser);
      expect(screen.getByTestId('token').textContent).toBe(authToken);
    });

});

describe('Testing auth state when localStorage contains auth', () => {
    it('should not be null/empty when localStorage contains auth', () => {
        localStorage.setItem('auth', JSON.stringify(authStub));
        render(
        <AuthProvider>
            <TestChild />
        </AuthProvider>
        );
    
        expect(screen.getByTestId('user').textContent).toBe(authUser);
        expect(screen.getByTestId('token').textContent).toBe(authToken);
        localStorage.clear();
    });
});

describe('Axios authorization header should be set', () => {
    beforeEach(() => {
        render(
        <AuthProvider>
            <TestChild />
        </AuthProvider>
        );
    });
    
    it('should be empty initially', () => {
        expect(axios.defaults.headers.common["Authorization"]).toBe('');
    });

    it('should be updated when auth changes', () => {
        fireEvent.click(screen.getByText('updateAuth'));

        expect(axios.defaults.headers.common["Authorization"]).toBe(authToken);
    });
});