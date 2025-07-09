/**
 * TabBar animado com indicadores e transições suaves
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tabSelection } from '../../animations/microInteractions';
import { SPRING_CONFIGS } from '../../animations/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Tab {
  key: string;
  title: string;
  icon?: string;
  badge?: number;
}

interface AnimatedTabBarProps {
  tabs: Tab[];
  selectedIndex: number;
  onTabPress: (index: number) => void;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  indicatorStyle?: ViewStyle;
  labelStyle?: TextStyle;
  showLabels?: boolean;
  showIcons?: boolean;
  variant?: 'top' | 'bottom';
  indicatorVariant?: 'underline' | 'background' | 'pill';
}

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  selectedIndex,
  onTabPress,
  style,
  tabStyle,
  indicatorStyle,
  labelStyle,
  showLabels = true,
  showIcons = true,
  variant = 'top',
  indicatorVariant = 'underline',
}) => {
  const indicatorPosition = useSharedValue(0);
  const tabWidth = SCREEN_WIDTH / tabs.length;

  useEffect(() => {
    indicatorPosition.value = withSpring(
      selectedIndex * tabWidth,
      SPRING_CONFIGS.smooth
    );
  }, [selectedIndex, tabWidth]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      width: tabWidth,
      transform: [{ translateX: indicatorPosition.value }],
    };

    switch (indicatorVariant) {
      case 'underline':
        return {
          ...baseStyle,
          bottom: 0,
          height: 3,
          backgroundColor: '#2196F3',
          ...indicatorStyle,
        };
      case 'background':
        return {
          ...baseStyle,
          top: 4,
          bottom: 4,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderRadius: 8,
          ...indicatorStyle,
        };
      case 'pill':
        return {
          ...baseStyle,
          top: 8,
          bottom: 8,
          backgroundColor: '#2196F3',
          borderRadius: 20,
          ...indicatorStyle,
        };
      default:
        return baseStyle;
    }
  });

  const renderTab = (tab: Tab, index: number) => {
    const isSelected = selectedIndex === index;
    
    return (
      <TabItem
        key={tab.key}
        tab={tab}
        index={index}
        isSelected={isSelected}
        onPress={() => onTabPress(index)}
        showLabels={showLabels}
        showIcons={showIcons}
        indicatorVariant={indicatorVariant}
        tabStyle={tabStyle}
        labelStyle={labelStyle}
      />
    );
  };

  return (
    <View style={[styles.container, styles[variant], style]}>
      <Animated.View style={indicatorAnimatedStyle} />
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => renderTab(tab, index))}
      </View>
    </View>
  );
};

interface TabItemProps {
  tab: Tab;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  showLabels: boolean;
  showIcons: boolean;
  indicatorVariant: 'underline' | 'background' | 'pill';
  tabStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const TabItem: React.FC<TabItemProps> = ({
  tab,
  index,
  isSelected,
  onPress,
  showLabels,
  showIcons,
  indicatorVariant,
  tabStyle,
  labelStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isSelected ? 1 : 0.7);

  useEffect(() => {
    opacity.value = withSpring(isSelected ? 1 : 0.7, SPRING_CONFIGS.smooth);
  }, [isSelected]);

  const handlePress = useCallback(() => {
    tabSelection(indicatorPosition, scale, index * tabWidth, { haptic: true });
    onPress();
  }, [index, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const getTextColor = () => {
    if (indicatorVariant === 'pill' && isSelected) {
      return '#FFFFFF';
    }
    return isSelected ? '#2196F3' : '#666666';
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.tab, tabStyle]}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {showIcons && tab.icon && (
          <MaterialCommunityIcons
            name={tab.icon as any}
            size={24}
            color={getTextColor()}
            style={showLabels ? styles.iconWithLabel : undefined}
          />
        )}
        {showLabels && (
          <Text
            style={[
              styles.label,
              { color: getTextColor() },
              labelStyle,
            ]}
          >
            {tab.title}
          </Text>
        )}
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  top: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWithLabel: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AnimatedTabBar;