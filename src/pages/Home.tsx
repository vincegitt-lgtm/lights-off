import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText, IonSpinner, IonButton, IonIcon, IonCardSubtitle } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { partlySunnyOutline, warningOutline } from 'ionicons/icons';

const Home: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Weather State
  const [weatherData, setWeatherData] = useState<{ condition: string, temp: number, isRaining: boolean } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  const navigate = useNavigate();

  // Function para makuha ang coordinates base sa branch
  const getCoordinates = (branch: string) => {
    switch(branch) {
      case 'Naujan': return { lat: 13.3244, lon: 121.3066 };
      case 'Socorro': return { lat: 13.0431, lon: 121.4128 };
      case 'Calapan City': return { lat: 13.4115, lon: 121.1803 };
      default: return { lat: 13.4000, lon: 121.1833 };
    }
  };

  useEffect(() => {
    let unsubscribe: any;
    
    const fetchUserDataAndWeather = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const branch = userDoc.data().branch;
          setUserBranch(branch);

          // Fetch Weather base sa branch
          const { lat, lon } = getCoordinates(branch);
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FManila`);
            const data = await res.json();
            
            const temp = data.current.temperature_2m;
            const code = data.current.weather_code;
            
            let condition = "Clear";
            if (code > 0 && code < 50) condition = "Cloudy";
            if (code >= 51 && code <= 67) condition = "Raining";
            if (code >= 80 && code <= 82) condition = "Heavy Rain";
            if (code >= 95) condition = "Thunderstorm";

            const isRaining = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95);
            
            setWeatherData({ condition, temp, isRaining });
          } catch (error) {
            console.error("Weather API error:", error);
          }
          setWeatherLoading(false);

          // Fetch Announcements
          const q = query(
            collection(db, 'announcements'),
            where('branch', '==', branch)
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const data: any[] = [];
            snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
            // Ipakita lang ang 'ongoing' sa Home
            const filtered = data.filter(d => d.status === 'ongoing');
            filtered.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
            setAnnouncements(filtered);
            setLoading(false);
          });
        }
      }
    };

    fetchUserDataAndWeather();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>LightsOff ({userBranch || 'Loading...'})</IonTitle>
          {/* TINANGGAL NA ANG LOGOUT BUTTON DITO */}
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        {/* WEATHER INFO CARD */}
        {!weatherLoading && weatherData && (
          <IonCard color={weatherData.isRaining ? "warning" : "tertiary"} style={{ margin: '0 0 15px 0' }}>
            <IonCardHeader>
              <IonCardSubtitle style={{ color: weatherData.isRaining ? '#000' : '#fff' }}>
                <IonIcon icon={partlySunnyOutline} /> Current Weather in {userBranch}
              </IonCardSubtitle>
              <IonCardTitle style={{ color: weatherData.isRaining ? '#000' : '#fff', fontSize: '1.3em' }}>
                {weatherData.condition} | {weatherData.temp}°C
              </IonCardTitle>
            </IonCardHeader>
            {weatherData.isRaining && (
              <IonCardContent style={{ color: '#000', paddingTop: '0' }}>
                <IonIcon icon={warningOutline} /> <strong>Alert:</strong> Umuulan ng malakas sa inyong lugar. Mag-ingat sa posibleng brownout.
              </IonCardContent>
            )}
          </IonCard>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <h2 style={{ margin: 0 }}>Official Announcements</h2>
          <IonButton size="small" fill="outline" onClick={() => navigate('/outage-history')}>
            History
          </IonButton>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : announcements.length === 0 ? (
          <IonText color="medium"><p>Walang aktibong announcements ngayon para sa branch na ito.</p></IonText>
        ) : (
          announcements.map((ann) => (
            <IonCard key={ann.id}>
              <IonCardHeader>
                <IonCardTitle>{ann.title}</IonCardTitle>
                <IonBadge color="danger">ONGOING</IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <p>{ann.description}</p>
                <p style={{ fontSize: '0.8em', color: 'gray' }}>
                  <strong>Apektado:</strong> {ann.affectedAreas?.join(', ')}
                </p>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;