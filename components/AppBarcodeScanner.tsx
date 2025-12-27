import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Linking, Text, StyleSheet, Alert } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

export enum TorchMode {
  OFF = 'off',
  ON = 'on',
}

interface AppBarcodeScannerProps {
  onBarcodeScanned: (scannedCode: string) => void;
  handleNoPermission?: () => void;
}

const AppBarcodeScanner: React.FC<AppBarcodeScannerProps> = ({
  onBarcodeScanned,
  handleNoPermission,
}) => {
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [torch, setTorch] = useState<TorchMode>(TorchMode.OFF);
  const [isScanned, setIsScanned] = useState(false);

  const checkCameraPermission = async () => {
    if (!hasPermission) {
      const permission = await requestPermission();
      if (!permission && handleNoPermission) {
        handleNoPermission();
      }
    }
  };

  useEffect(() => {
    if (isFocused) {
      checkCameraPermission();
    }
    if (!isFocused && torch === TorchMode.ON) {
      setTorch(TorchMode.OFF);
    }
    if (!isFocused && isScanned) {
      setTimeout(() => {
        setIsScanned(false);
      }, 1000);
    }
  }, [isFocused]);

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128', 'code-39', 'code-93', 'ean-13', 'ean-8', 'qr', 'pdf-417'],
    onCodeScanned: (codes) => {
      if (isScanned) {
        return;
      }
      if (codes && codes.length > 0) {
        setIsScanned(true);
        for (const scannedBarcode of codes) {
          if (scannedBarcode.value && scannedBarcode.value !== '') {
            onBarcodeScanned(scannedBarcode.value);
            setTimeout(() => setIsScanned(false), 1000);
            break;
          }
        }
      }
    },
  });

  const toggleFlash = () => {
    if (device?.hasTorch || device?.hasFlash) {
      setTorch(prev => (prev === TorchMode.OFF ? TorchMode.ON : TorchMode.OFF));
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>אין הרשאת מצלמה</Text>
        <Text style={styles.permissionText}>
          אפליקציה זו זקוקה להרשאת מצלמה כדי לסרוק ברקודים.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            Linking.openSettings();
          }}>
          <Text style={styles.permissionButtonText}>פתח הגדרות</Text>
        </TouchableOpacity>
        {handleNoPermission && (
          <TouchableOpacity
            style={[styles.permissionButton, styles.cancelButton]}
            onPress={handleNoPermission}>
            <Text style={styles.permissionButtonText}>ביטול</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>מצלמה לא זמינה</Text>
        <Text style={styles.permissionText}>
          לא ניתן לגשת למצלמה במכשיר זה.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraWrapper}>
        <Camera
          style={styles.camera}
          device={device}
          torch={torch}
          isActive={isFocused}
          codeScanner={codeScanner}
        />
        <View style={styles.overlay}>
          <View style={styles.outer} />
          <View style={styles.scannerBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.outer} />
        </View>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>מקם את הברקוד בתוך המסגרת</Text>
        </View>
      </View>
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Text style={styles.flashButtonText}>
            {torch === TorchMode.OFF ? '🔦 פנס כבוי' : '💡 פנס דלוק'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '100%',
  },
  scannerBox: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  flashButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  flashButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppBarcodeScanner;
