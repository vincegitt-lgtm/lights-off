import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonText, IonBadge, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { downloadOutline } from 'ionicons/icons';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  adminBranch: string;
}

const ActionRequired: React.FC<Props> = ({ adminBranch }) => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    // Kukunin natin approved at resolved para pareho silang lumabas dito
    const q = query(
      collection(db, 'reports'), 
      where('branch', '==', adminBranch),
      where('status', 'in', ['approved', 'resolved'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setReports(data);
    });

    return () => unsubscribe();
  }, [adminBranch]);

  const handleResolve = async (report: any) => {
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'resolved',
        resolvedBy: auth.currentUser?.uid,
      });
    } catch (error) {
      console.error("Error resolving report: ", error);
    }
  };

  const downloadPDF = () => {
    if (reports.length === 0) {
      alert("Walang reports na idadownload.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Action Required & Resolved - ${adminBranch}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = reports.map((r) => [
      r.barangay,
      r.description,
      r.status.toUpperCase(),
      r.userName || 'Anonymous',
      `${r.latitude?.toFixed(4) || 'N/A'}, ${r.longitude?.toFixed(4) || 'N/A'}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Barangay', 'Description', 'Status', 'Reported By', 'Coordinates']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`Action_Required_${adminBranch}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Action Required</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p>Ito ang mga na-approve at resolved na reports.</p>
        
        {reports.length > 0 && (
          <IonButton expand="block" color="tertiary" onClick={downloadPDF} style={{ marginBottom: '20px' }}>
            <IonIcon slot="start" icon={downloadOutline} />
            Download PDF (Approved & Resolved)
          </IonButton>
        )}

        {reports.length === 0 ? (
          <IonText color="medium"><p>Wala pang action required ngayon.</p></IonText>
        ) : (
          reports.map((report) => (
            <IonCard key={report.id} style={{ borderLeft: report.status === 'resolved' ? '6px solid green' : '6px solid blue' }}>
              <IonCardContent>
                <h3>{report.barangay}</h3>
                <IonBadge color={report.status === 'resolved' ? 'success' : 'primary'}>
                  {report.status.toUpperCase()}
                </IonBadge>
                <p style={{ marginTop: '10px' }}>{report.description}</p>
                <p style={{ fontSize: '0.8em', color: 'gray' }}>
                  <strong>Reported by:</strong> {report.userName || 'Anonymous'}
                </p>
                
                {report.latitude && report.longitude && (
                  <div style={{ height: '150px', width: '100%', marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer center={[report.latitude, report.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[report.latitude, report.longitude]} />
                    </MapContainer>
                  </div>
                )}

                {/* Kung Approved pa lang, may Resolve button */}
                {report.status === 'approved' && (
                  <IonButton expand="block" color="success" className="ion-margin-top" onClick={() => handleResolve(report)}>
                    Mark as Resolved
                  </IonButton>
                )}

                {/* Kung Resolved na, walang button */}
                {report.status === 'resolved' && (
                  <p style={{ fontSize: '0.8em', color: 'green', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                    ✓ Na-resolve na ang isyung ito.
                  </p>
                )}
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ActionRequired;