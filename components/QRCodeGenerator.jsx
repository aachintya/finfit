// QRCodeGenerator.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useGlobalContext } from './globalProvider';

export function QRCodeGenerator() {
  const { generateTransferData } = useGlobalContext();
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const data = await generateTransferData();
      setQrData(data);
    };
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      {qrData ? (
        <QRCode
          value={qrData}
          size={250}
          backgroundColor="white"
          color="black"
        />
      ) : null}
    </View>
  );
}
