import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { selectIsOnline, selectNetworkInfo } from '../store/slices/offlineSlice';

/**
 * Barra de status de rede que aparece quando offline
 * Mostra informações sobre o estado da conexão
 */
export const NetworkStatusBar: React.FC = () => {
  const theme = useTheme();
  const isOnline = useSelector(selectIsOnline);
  const networkInfo = useSelector(selectNetworkInfo);
  const [animatedValue] = useState(new Animated.Value(0));
  const [showBar, setShowBar] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setShowBar(true);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBar(false);
      });
    }
  }, [isOnline, animatedValue]);

  if (!showBar) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  // Determinar cor e ícone baseado no estado
  const getStatusInfo = () => {
    if (!networkInfo.isConnected) {
      return {
        color: theme.colors.error,
        icon: 'wifi-off',
        text: 'Sem conexão de rede',
      };
    } else if (networkInfo.isInternetReachable === false) {
      return {
        color: theme.colors.tertiary,
        icon: 'wifi-alert',
        text: 'Sem acesso à internet',
      };
    } else {
      return {
        color: theme.colors.primary,
        icon: 'wifi-check',
        text: 'Reconectando...',
      };
    }
  };

  const { color, icon, text } = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: color,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Icon name={icon} size={20} color="white" style={styles.icon} />
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.subText}>Modo offline ativo</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 30, // Para SafeArea
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});

export default NetworkStatusBar;