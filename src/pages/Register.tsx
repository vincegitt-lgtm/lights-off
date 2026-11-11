import { useState, useEffect } from 'react';
import { IonContent, IonPage, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonText, IonIcon, IonCheckbox } from '@ionic/react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { eyeOutline, eyeOffOutline, logoGoogle } from 'ionicons/icons';
import logo from '../assets/logo.png';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('Naujan');
  const [address, setAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleUid, setGoogleUid] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedGoogleUser = localStorage.getItem('googleUser');
    if (savedGoogleUser) {
      const user = JSON.parse(savedGoogleUser);
      setName(user.name);
      setEmail(user.email);
      setGoogleUid(user.uid);
      setIsGoogleUser(true);
    }
  }, []);

  const handleGoogleSignUp = async () => {
    setError('');
    if (!agreedToTerms) {
      setError('Kailangan mong sumang-ayon sa Terms and Conditions.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email || !user.email.endsWith('@gmail.com')) {
        setError('Mali: Kailangan gumamit ng @gmail.com account.');
        return;
      }

      // Auto-fill ang Name at Email
      setName(user.displayName || 'Google User');
      setEmail(user.email);
      setGoogleUid(user.uid);
      setIsGoogleUser(true);

      // Check kung existing user
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') navigate('/admin');
        else navigate('/home');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !address || !barangay || !branch) {
      setError('Punan ang lahat ng fields.');
      return;
    }
    if (!agreedToTerms) {
      setError('Kailangan mong sumang-ayon sa Terms and Conditions.');
      return;
    }

    try {
      if (isGoogleUser) {
        // Google user: i-save lang sa Firestore
        await setDoc(doc(db, 'users', googleUid), {
          uid: googleUid,
          email: email,
          name: name,
          role: 'consumer',
          branch: branch,
          address: address,
          barangay: barangay,
        });
        localStorage.removeItem('googleUser');
        navigate('/home');
      } else {
        // Email/Password user
        if (!email || !password) {
          setError('Punan ang email at password.');
          return;
        }
        if (!email.endsWith('@gmail.com')) {
          setError('Mali: Kailangan gumamit ng @gmail.com account.');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          name: name,
          role: 'consumer',
          branch: branch,
          address: address,
          barangay: barangay,
        });
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <img src={logo} alt="LightsOff Logo" style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '10px' }} />
          <h1 style={{ fontWeight: '900', fontSize: '2rem', color: 'var(--ion-text-color)', margin: '0' }}>Create Account</h1>
        </div>

        <div style={{ backgroundColor: 'var(--ion-card-background)', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          
          <IonItem lines="none" style={{ marginBottom: '10px' }}>
            <IonLabel position="stacked">Buong Pangalan</IonLabel>
            <IonInput value={name} onIonChange={e => setName(e.detail.value!)} readonly={isGoogleUser} />
          </IonItem>
          
          <IonItem lines="none" style={{ marginBottom: '10px' }}>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} readonly={isGoogleUser} />
          </IonItem>
          
          {!isGoogleUser && (
            <IonItem lines="none" style={{ marginBottom: '10px' }}>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput type={showPassword ? 'text' : 'password'} value={password} onIonChange={e => setPassword(e.detail.value!)} />
              <IonButton fill="clear" slot="end" onClick={() => setShowPassword(!showPassword)}>
                <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} color="medium" />
              </IonButton>
            </IonItem>
          )}

          <IonItem lines="none" style={{ marginBottom: '10px' }}>
            <IonLabel position="stacked">Kumpletong Address</IonLabel>
            <IonInput value={address} onIonChange={e => setAddress(e.detail.value!)} placeholder="Hal: Brgy. Poblacion, Naujan, Oriental Mindoro" />
          </IonItem>

          <IonItem lines="none" style={{ marginBottom: '10px' }}>
            <IonLabel position="stacked">Barangay</IonLabel>
            <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} placeholder="Hal: Poblacion" />
          </IonItem>

          <IonItem lines="none" style={{ marginBottom: '20px' }}>
            <IonLabel position="stacked">Branch</IonLabel>
            <IonSelect value={branch} onIonChange={e => setBranch(e.detail.value)}>
              <IonSelectOption value="Naujan">Naujan</IonSelectOption>
              <IonSelectOption value="Socorro">Socorro</IonSelectOption>
              <IonSelectOption value="Calapan City">Calapan City</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem lines="none" style={{ marginBottom: '15px', '--background': 'transparent', '--padding-start': '0' }}>
            <IonCheckbox checked={agreedToTerms} onIonChange={e => setAgreedToTerms(e.detail.checked)} slot="start" color="success" />
            <IonLabel className="ion-text-wrap" style={{ fontSize: '0.85em', marginLeft: '10px' }}>
              I have read and agree to the <strong style={{ color: 'var(--app-green)' }}>Terms and Conditions</strong>.
            </IonLabel>
          </IonItem>

          {error && <IonText color="danger"><p style={{ fontSize: '0.9em' }}>{error}</p></IonText>}

          <IonButton expand="block" onClick={handleRegister} disabled={!agreedToTerms} style={{ '--background': 'var(--app-yellow)', '--color': '#000000', height: '50px', '--border-radius': '12px', fontWeight: 'bold' }}>
            {isGoogleUser ? 'Complete Registration' : 'REGISTER'}
          </IonButton>

          {!isGoogleUser && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                <span style={{ padding: '0 10px', color: 'gray', fontSize: '0.8em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
              </div>

              <IonButton expand="block" onClick={handleGoogleSignUp} disabled={!agreedToTerms} style={{ '--background': '#ffffff', '--color': '#000000', '--border-color': '#e0e0e0', '--border-style': 'solid', '--border-width': '1px', height: '50px', '--border-radius': '12px' }}>
                <IonIcon slot="start" icon={logoGoogle} style={{ color: '#DB4437' }} /> Sign up with Google
              </IonButton>
            </>
          )}

          <IonButton expand="block" fill="clear" routerLink="/login" style={{ marginTop: '10px', '--color': 'var(--app-green)' }}>
            May account na? Login
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;