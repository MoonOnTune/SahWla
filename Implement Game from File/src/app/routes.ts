import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/pages/LoginPage';
import { HomePage } from './components/pages/HomePage';
import { ShopPage } from './components/pages/ShopPage';
import { AccountPage } from './components/pages/AccountPage';
import { PlayPage } from './components/pages/PlayPage';
import { ContactPage } from './components/pages/ContactPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'login', Component: LoginPage },
      { path: 'home', Component: HomePage },
      { path: 'shop', Component: ShopPage },
      { path: 'account', Component: AccountPage },
      { path: 'play', Component: PlayPage },
      { path: 'contact', Component: ContactPage },
      { path: '*', Component: HomePage },
    ],
  },
]);