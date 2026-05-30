import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from '@carbon/react';
import { Logout } from '@carbon/icons-react';
import { useAuth } from '../auth/AuthContext';

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <>
      <Header aria-label="IPCK House">
        <HeaderName prefix="IPCK">House</HeaderName>
        <HeaderNavigation aria-label="Navigation">
          <HeaderMenuItem isActive={location.pathname === '/'} onClick={() => navigate('/')}>
            Vue d'ensemble
          </HeaderMenuItem>
          <HeaderMenuItem isActive={location.pathname === '/care'} onClick={() => navigate('/care')}>
            Soin
          </HeaderMenuItem>
          <HeaderMenuItem
            isActive={location.pathname === '/giving'}
            onClick={() => navigate('/giving')}
          >
            Dons
          </HeaderMenuItem>
          <HeaderMenuItem
            isActive={location.pathname === '/content'}
            onClick={() => navigate('/content')}
          >
            Contenus
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderGlobalBar>
          <span style={{ alignSelf: 'center', paddingRight: '1rem', fontSize: '0.8rem' }}>
            {user?.firstName} {user?.lastName} · {user?.role}
          </span>
          <HeaderGlobalAction
            aria-label="Déconnexion"
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            <Logout size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <main style={{ marginTop: '3rem' }}>{children}</main>
    </>
  );
}
