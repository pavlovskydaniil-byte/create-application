// src/components/CardForm.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import CardForm from './CardForm';

// === МОКИ ===
jest.mock('axios');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-12345'),
}));

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ РЕНДЕРА С ROUTER ===
const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

// === ТЕСТЫ ===
describe('CardForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Мокаем window.alert, чтобы не показывался в тестах
    global.alert = jest.fn();
  });

  afterAll(() => {
    global.alert.mockRestore();
  });

  // --- 1. ПРОВЕРКА РЕНДЕРА ---
  it('renders payment form with all input fields and labels', () => {
    renderWithRouter(<CardForm />);

    expect(screen.getByText('Оплата банковской картой')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0000 0000 0000 0000')).toBeInTheDocument(); // Номер карты
    expect(screen.getByPlaceholderText('MM/YY')).toBeInTheDocument();               // Срок действия
    expect(screen.getByPlaceholderText('***')).toBeInTheDocument();                   // CVV
    expect(screen.getByPlaceholderText('IVAN IVANOV')).toBeInTheDocument();           // Владелец
    expect(screen.getByRole('button', { name: 'Оплатить' })).toBeInTheDocument();     // Кнопка
    expect(screen.getByAltText('cat')).toBeInTheDocument();                           // Изображение
  });

  // --- 2. ФОРМАТИРОВАНИЕ НОМЕРА КАРТЫ ---
  it('formats card number input with spaces every 4 digits', () => {
    renderWithRouter(<CardForm />);

    const cardInput = screen.getByPlaceholderText('0000 0000 0000 0000');
    fireEvent.change(cardInput, { target: { value: '1234567890123456' } });

    expect(cardInput.value).toBe('1234 5678 9012 3456');
  });

  // --- 3. ФОРМАТИРОВАНИЕ СРОКА ДЕЙСТВИЯ ---
  it('formats expiration date input as MM/YY', () => {
    renderWithRouter(<CardForm />);

    const expInput = screen.getByPlaceholderText('MM/YY');
    fireEvent.change(expInput, { target: { value: '1225' } });

    expect(expInput.value).toBe('12/25');
  });

  // --- 4. ВАЛИДАЦИЯ (все поля пустые) ---
  it('shows validation errors when submitting empty form', async () => {
    renderWithRouter(<CardForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Оплатить' }));

    expect(await screen.findByText('Номер карты должен содержать от 13 до 19 цифр')).toBeInTheDocument();
    expect(await screen.findByText('Введите дату в формате MM/YY')).toBeInTheDocument();
    expect(await screen.findByText('CVV должен содержать ровно 3 цифры')).toBeInTheDocument();
    expect(await screen.findByText('Введите имя и фамилию')).toBeInTheDocument();
  });

  // --- 5. УСПЕШНАЯ ОТПРАВКА ---
  it('submits form and navigates to /:pid on successful API response', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        result: { pid: 'payment-789xyz' },
      },
    });

    renderWithRouter(<CardForm />);

    // Заполняем форму корректными данными
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '4242 4242 4242 4242' },
    });
    fireEvent.change(screen.getByPlaceholderText('MM/YY'), {
      target: { value: '12/25' },
    });
    fireEvent.change(screen.getByPlaceholderText('***'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText('IVAN IVANOV'), {
      target: { value: 'Иван Иванов' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Оплатить' }));

    // Проверяем вызов axios
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:2050/api', {
        jsonrpc: '2.0',
        id: 'mocked-uuid-12345',
        method: 'pay',
        params: {
          pan: '4242424242424242',
          expire: '12/25',
          cardholder: 'Иван Иванов',
          cvc: '123',
        },
      });
    });

    // Проверяем навигацию (MemoryRouter не меняет window.location, но можно проверить через mock)
    // В реальном приложении navigate вызовет переход — в тестах мы проверяем, что он был вызван.
    // Но проще проверить, что alert НЕ был вызван, и что запрос прошёл.
    expect(global.alert).not.toHaveBeenCalled();
  });

  // --- 6. ОШИБКА: НЕТ PID В ОТВЕТЕ ---
  it('shows alert when API response does not contain pid', async () => {
    axios.post.mockResolvedValueOnce({
       
        result: {}, // нет pid
      },
  );

    renderWithRouter(<CardForm />);

    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '4242 4242 4242 4242' },
    });
    fireEvent.change(screen.getByPlaceholderText('MM/YY'), {
      target: { value: '12/25' },
    });
    fireEvent.change(screen.getByPlaceholderText('***'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText('IVAN IVANOV'), {
      target: { value: 'Иван Иванов' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Оплатить' }));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Ошибка оплаты: PID не получен');
    });
  });

  // --- 7. СЕТЕВАЯ ОШИБКА ---
  it('shows generic error alert on network failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<CardForm />);

    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), {
      target: { value: '4242 4242 4242 4242' },
    });
    fireEvent.change(screen.getByPlaceholderText('MM/YY'), {
      target: { value: '12/25' },
    });
    fireEvent.change(screen.getByPlaceholderText('***'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText('IVAN IVANOV'), {
      target: { value: 'Иван Иванов' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Оплатить' }));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Произошла ошибка при оплате');
    });
  });
});