import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Avatar,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

// Redux
import { AppDispatch } from '../store';
import {
  uploadAvatar,
  selectUserUpdating,
} from '../store/slices/userSlice';

// Theme
import { theme, getSpacing as _getSpacing } from '../theme';

/**
 * Componente de Upload de Avatar
 * Permite selecionar e fazer upload de foto de perfil
 */

interface AvatarUploadProps {
  currentAvatar?: string | null;
  size?: number;
  onUploadComplete?: () => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  size = 80,
  onUploadComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isUpdating = useSelector(selectUserUpdating);
  
  const [localAvatar, setLocalAvatar] = useState<string | null>(currentAvatar || null);

  /**
   * Handle avatar selection
   */
  const handleAvatarPress = () => {
    Alert.alert(
      'Alterar Foto',
      'Escolha uma opção',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Escolher da Galeria', onPress: selectFromGallery },
        { text: 'Remover Foto', onPress: removeAvatar, style: 'destructive' },
      ]
    );
  };

  /**
   * Select image from gallery
   */
  const selectFromGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          uploadImage(asset.uri);
        }
      }
    });
  };

  /**
   * Upload image to server
   */
  const uploadImage = async (imageUri: string) => {
    try {
      // Update local state immediately for better UX
      setLocalAvatar(imageUri);
      
      const avatarUrl = await dispatch(uploadAvatar(imageUri)).unwrap();
      setLocalAvatar(avatarUrl);
      
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
      onUploadComplete?.();
    } catch (error: any) {
      // Revert local state on error
      setLocalAvatar(currentAvatar || null);
      Alert.alert('Erro', error.message || 'Erro ao fazer upload da foto');
    }
  };

  /**
   * Remove avatar
   */
  const removeAvatar = async () => {
    try {
      setLocalAvatar(null);
      await dispatch(uploadAvatar('')).unwrap();
      
      Alert.alert('Sucesso', 'Foto de perfil removida!');
      onUploadComplete?.();
    } catch (error: any) {
      setLocalAvatar(currentAvatar || null);
      Alert.alert('Erro', error.message || 'Erro ao remover foto');
    }
  };

  /**
   * Get avatar source
   */
  const getAvatarSource = () => {
    if (localAvatar) {
      return { uri: localAvatar };
    }
    return undefined;
  };

  /**
   * Get avatar label
   */
  const getAvatarLabel = (): string => {
    // Extract initials from user name if no avatar
    // This would typically come from user profile
    return 'U'; // Default fallback
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleAvatarPress}
        disabled={isUpdating}
        style={[
          styles.avatarContainer,
          { width: size, height: size },
          isUpdating && styles.avatarContainerDisabled,
        ]}
      >
        {isUpdating ? (
          <View style={[styles.loadingContainer, { width: size, height: size }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <Avatar.Image
              size={size}
              source={getAvatarSource()}
              style={styles.avatar}
            />
            {!localAvatar && (
              <Avatar.Text
                size={size}
                label={getAvatarLabel()}
                style={styles.avatar}
              />
            )}
          </>
        )}
        
        {/* Edit overlay */}
        <View style={[styles.editOverlay, { borderRadius: size / 2 }]}>
          <IconButton
            icon="camera"
            size={size * 0.25}
            iconColor="white"
            style={styles.editIcon}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatarContainerDisabled: {
    opacity: 0.7,
  },
  avatar: {
    backgroundColor: theme.colors.primaryContainer,
  },
  loadingContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  editIcon: {
    margin: 0,
  },
});

// Show edit overlay on press

export default AvatarUpload;