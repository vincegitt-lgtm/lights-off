import { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonText, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import { signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { eyeOutline, eyeOffOutline, logoGoogle } from 'ionicons/icons';
import logo from '../assets/logo.png'; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'consumer' | 'admin'>('consumer');
  const [adminBranch, setAdminBranch] = useState('Naujan');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // Gagamitin natin ang signInWithPopup dahil naka-HTTPS na tayo
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email || !user.email.endsWith('@gmail.com')) {
        await signOut(auth);
        setError('Mali: Kailangan gumamit ng @gmail.com account.');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Kung bagong Google user, awtomatikong gumawa ng consumer account
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Google User',
          role: 'consumer',
          branch: 'Naujan',
          address: 'Hindi pa nailalagay',
        });
        navigate('/home');
      } else {
        const userData = userDoc.data();
        if (userData.role === 'admin') navigate('/admin');
        else navigate('/home');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Punan ang email at password.');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.email || !user.email.endsWith('@gmail.com')) {
        await signOut(auth);
        setError('Mali: Kailangan gumamit ng @gmail.com account.');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (loginType === 'admin') {
          if (userData.role !== 'admin') {
            await signOut(auth);
            setError('Access Denied: Hindi ka admin.');
            return;
          }
          if (userData.branch !== adminBranch) {
            await signOut(auth);
            setError(`Access Denied: Ang account na ito ay hindi nakatalaga sa ${adminBranch} branch.`);
            return;
          }
          navigate('/admin');
        } else {
          if (userData.role === 'admin') navigate('/admin');
          else navigate('/home');
        }
      } else {
        await signOut(auth);
        setError('Walang user data sa Firestore.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--ion-background-color)' }}>
        
        <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '30px' }}>
          <img src={logo} alt="LightsOff Logo" style={{ width: '150px', height: '150px', objectFit: 'contain', marginBottom: '15px' }} />
          <h1 style={{ fontWeight: '900', fontSize: '2rem', color: 'var(--ion-text-color)', margin: '0' }}>LightsOff</h1>
          <p style={{ color: 'gray', fontSize: '0.9em' }}>Power Outage Notification System</p>
        </div>

        <div style={{ backgroundColor: 'var(--ion-card-background)', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          
          <IonSegment value={loginType} onIonChange={e => setLoginType(e.detail.value as 'consumer' | 'admin')} style={{ marginBottom: '20px' }}>
            <IonSegmentButton value="consumer">
              <IonLabel>Consumer</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="admin">
              <IonLabel>Admin</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <div>
            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} />
            </IonItem>
            
            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onIonChange={e => setPassword(e.detail.value!)} 
              />
              <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)}>
                <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} color="medium" />
              </IonButton>
            </IonItem>
            
            {loginType === 'admin' && (
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Branch</IonLabel>
                <IonSelect value={adminBranch} onIonChange={e => setAdminBranch(e.detail.value)}>
                  <IonSelectOption value="Naujan">Naujan</IonSelectOption>
                  <IonSelectOption value="Socorro">Socorro</IonSelectOption>
                  <IonSelectOption value="Calapan City">Calapan City</IonSelectOption>
                </IonSelect>
              </IonItem>
            )}
          </div>

          {error && <IonText color="danger"><p style={{ fontSize: '0.9em' }}>{error}</p></IonText>}

          <IonButton 
            expand="block" 
            onClick={handleLogin} 
            style={{ '--background': 'var(--app-yellow)', '--color': '#000000', height: '50px', marginTop: '20px' }}
          >
            LOGIN
          </IonButton>

          {loginType === 'consumer' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                <span style={{ padding: '0 10px', color: 'gray', fontSize: '0.8em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
              </div>

              <IonButton 
                expand="block" 
                onClick={handleGoogleSignIn}
                style={{ '--background': '#ffffff', '--color': '#000000', '--border-color': '#e0e0e0', '--border-style': 'solid', '--border-width': '1px', height: '50px', '--border-radius': '12px' }}
              >
                <IonIcon slot="start" icon={logoGoogle} style={{ color: '#DB4437' }} /> Sign in with Google
              </IonButton>

              <IonButton expand="block" fill="clear" routerLink="/register" style={{ marginTop: '10px', '--color': 'var(--app-green)' }}>
                Walang account? Register
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;