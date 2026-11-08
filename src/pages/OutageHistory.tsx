import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText, IonSpinner, IonList } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const OutageHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [userBranch, setUserBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: any;

    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const branch = userDoc.data().branch;
          setUserBranch(branch);

          // Kunin lang ang mga 'restored' at 'cancelled' na announcements
          const q = query(
            collection(db, 'announcements'),
            where('branch', '==', branch),
            where('status', 'in', ['restored', 'cancelled'])
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const data: any[] = [];
            snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
            // I-sort para ang pinakabago ang nasa taas
            data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
            setHistory(data);
            setLoading(false);
          });
        }
      }
    };

    fetchData();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Outage History ({userBranch})</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: 'gray', fontSize: '0.9em' }}>
          Ito ang mga nakaraang brownout na na-restore o na-cancel na sa inyong branch.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : history.length === 0 ? (
          <IonText color="medium"><p>Wala pang history ng outages sa branch na ito.</p></IonText>
        ) : (
          history.map((ann) => (
            <IonCard key={ann.id}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1.1em' }}>{ann.title}</IonCardTitle>
                <IonBadge color={ann.status === 'restored' ? 'success' : 'medium'}>
                  {ann.status.toUpperCase()}
                </IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <p style={{ fontSize: '0.9em' }}>{ann.description}</p>
                <p style={{ fontSize: '0.8em', color: 'gray', marginTop: '5px' }}>
                  <strong>Apektado:</strong> {ann.affectedAreas?.join(', ')}
                </p>
                <p style={{ fontSize: '0.8em', color: 'gray' }}>
                  <strong>Petsa:</strong> {ann.timestamp ? new Date(ann.timestamp.toMillis()).toLocaleDateString() : 'N/A'}
                </p>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default OutageHistory;