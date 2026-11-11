import { IonContent, IonPage, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#000000' // <-- DITO NA NAKALAGAY ANG BACKGROUND
        }}>
          
          {/* LOGO */}
          <img 
            src={logo} 
            alt="LightsOff Logo" 
            style={{ 
              width: '150px', 
              height: '150px', 
              objectFit: 'contain', 
              marginBottom: '30px',
              filter: 'drop-shadow(0 0 20px #00C853)'
            }} 
          />

          {/* TITLE */}
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '900', 
            color: '#ffffff', 
            margin: '0 0 15px 0',
            letterSpacing: '1px'
          }}>
            LightsOff
          </h1>

          {/* DESCRIPTION */}
          <p style={{ 
            fontSize: '1rem', 
            color: '#aaaaaa', 
            marginBottom: '40px',
            lineHeight: '1.5',
            maxWidth: '300px'
          }}>
            Real-time power outage updates for Oriental Mindoro. Stay informed and report outages in your community.
          </p>

          {/* GET STARTED BUTTON */}
          <IonButton 
            expand="block" 
            onClick={() => navigate('/login')}
            style={{ 
              '--background': '#00C853', 
              '--color': '#000000', 
              '--border-radius': '12px', 
              width: '100%',
              maxWidth: '300px',
              height: '55px', 
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 0 15px #00C853'
            }}
          >
            Get started
          </IonButton>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Landing;