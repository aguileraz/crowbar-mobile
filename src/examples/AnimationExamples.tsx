/**
 * Exemplos de uso do sistema de animações
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedTabBar,
  AnimatedCheckbox,
  AnimatedRadioGroup,
  AnimatedProgressBar,
  SkeletonCard,
} from '../components/animated';
import {
  _useReanimatedAnimations,
  useEntranceAnimation,
  useListAnimation,
  useScrollAnimation,
  useFeedbackAnimation,
} from '../hooks/_useReanimatedAnimations';
import {
  usePanGesture,
  usePinchGesture,
  _useSwipeGesture,
} from '../hooks/useGestureAnimations';
import {
  useConditionalAnimation as _useConditionalAnimation,
  useMountAnimation,
  useShakeAnimation,
  useFloatingAnimation,
} from '../hooks/useAnimationHelpers';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';

export const AnimationExamples: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState('option1');
  const [progress, setProgress] = useState(30);
  const [showCard, setShowCard] = useState(true);
  const [triggerShake, setTriggerShake] = useState(false);

  // Hooks de animação
  const _entranceAnimation = useEntranceAnimation('combined', { autoStart: true });
  const listAnimation = useListAnimation(5, { staggerDelay: 100 });
  const { updateScroll, headerAnimatedStyle } = useScrollAnimation(100);
  const feedbackAnimation = useFeedbackAnimation();
  const panGesture = usePanGesture({ minX: -100, maxX: 100 });
  const pinchGesture = usePinchGesture({ minScale: 0.5, maxScale: 2 });
  const mountAnimation = useMountAnimation(showCard);
  const shakeAnimation = useShakeAnimation(triggerShake);
  const floatingAnimation = useFloatingAnimation({ amplitude: 20 });

  const tabs = [
    { key: 'home', title: 'Home', icon: 'home' },
    { key: 'search', title: 'Buscar', icon: 'magnify' },
    { key: 'cart', title: 'Carrinho', icon: 'cart', badge: 3 },
    { key: 'profile', title: 'Perfil', icon: 'account' },
  ];

  const radioOptions = [
    { value: 'option1', label: 'Opção 1' },
    { value: 'option2', label: 'Opção 2' },
    { value: 'option3', label: 'Opção 3' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        onScroll={(event) => {
          updateScroll(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        {/* Header animado */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Text style={styles.title}>Sistema de Animações</Text>
        </Animated.View>

        {/* Botões animados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Botões Animados</Text>
          <View style={styles.buttonContainer}>
            <AnimatedButton
              title="Primary"
              variant="primary"
              onPress={() => feedbackAnimation.showSuccess()}
            />
            <AnimatedButton
              title="Secondary"
              variant="secondary"
              icon="heart"
              onPress={() => feedbackAnimation.showError()}
            />
            <AnimatedButton
              title="Loading"
              variant="outline"
              loading
            />
          </View>
        </View>

        {/* Cards animados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards Animados</Text>
          <AnimatedButton
            title={showCard ? 'Esconder Card' : 'Mostrar Card'}
            variant="ghost"
            onPress={() => setShowCard(!showCard)}
            style={{ marginBottom: 16 }}
          />
          
          {showCard && (
            <Animated.View style={mountAnimation.animatedStyle}>
              <AnimatedCard
                elevation={4}
                onPress={() => {
                  setTriggerShake(true);
                  setTimeout(() => setTriggerShake(false), 500);
                }}
              >
                <Animated.View style={shakeAnimation.animatedStyle}>
                  <Text style={styles.cardTitle}>Card Animado</Text>
                  <Text style={styles.cardText}>
                    Pressione para ver animação de shake
                  </Text>
                </Animated.View>
              </AnimatedCard>
            </Animated.View>
          )}
        </View>

        {/* TabBar animada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TabBar Animada</Text>
          <AnimatedTabBar
            tabs={tabs}
            selectedIndex={selectedTab}
            onTabPress={setSelectedTab}
            indicatorVariant="pill"
          />
        </View>

        {/* Checkbox e Radio animados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checkbox e Radio</Text>
          <AnimatedCheckbox
            checked={isChecked}
            onToggle={setIsChecked}
            label="Checkbox animado"
            color="#4CAF50"
          />
          <View style={{ marginTop: 16 }}>
            <AnimatedRadioGroup
              options={radioOptions}
              selectedValue={selectedRadio}
              onValueChange={setSelectedRadio}
            />
          </View>
        </View>

        {/* Progress Bar animada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Bar</Text>
          <AnimatedProgressBar
            progress={progress}
            showLabel
            labelPosition="outside"
            variant="striped"
          />
          <View style={styles.buttonContainer}>
            <AnimatedButton
              title="-10%"
              variant="outline"
              size="small"
              onPress={() => setProgress(Math.max(0, progress - 10))}
            />
            <AnimatedButton
              title="+10%"
              variant="outline"
              size="small"
              onPress={() => setProgress(Math.min(100, progress + 10))}
            />
          </View>
        </View>

        {/* Gestos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestos</Text>
          
          {/* Pan Gesture */}
          <Text style={styles.subsectionTitle}>Arraste o card</Text>
          <GestureDetector gesture={panGesture.gesture}>
            <Animated.View style={[panGesture.animatedStyle]}>
              <AnimatedCard style={{ marginBottom: 16 }}>
                <Text>Arraste-me! 👆</Text>
              </AnimatedCard>
            </Animated.View>
          </GestureDetector>

          {/* Pinch Gesture */}
          <Text style={styles.subsectionTitle}>Faça pinça para zoom</Text>
          <GestureDetector gesture={pinchGesture.gesture}>
            <Animated.View style={[pinchGesture.animatedStyle]}>
              <AnimatedCard>
                <Text>Zoom com pinça! 🔍</Text>
              </AnimatedCard>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Lista animada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lista Animada</Text>
          {Array.from({ length: 5 }).map((_, index) => (
            <Animated.View
              key={index}
              style={listAnimation.getAnimatedStyle(index)}
            >
              <AnimatedCard style={{ marginBottom: 8 }}>
                <Text>Item {index + 1}</Text>
              </AnimatedCard>
            </Animated.View>
          ))}
        </View>

        {/* Skeleton Loading */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skeleton Loading</Text>
          <SkeletonCard preset="boxCard" />
        </View>

        {/* Floating Animation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animação Flutuante</Text>
          <Animated.View style={floatingAnimation.animatedStyle}>
            <AnimatedCard>
              <Text style={{ textAlign: 'center', fontSize: 24 }}>🎈</Text>
              <Text>Estou flutuando!</Text>
            </AnimatedCard>
          </Animated.View>
        </View>

        {/* Feedback Animation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animações de Feedback</Text>
          <Animated.View style={feedbackAnimation.animatedStyle}>
            <AnimatedCard>
              <Text>Resultado do feedback aparece aqui</Text>
            </AnimatedCard>
          </Animated.View>
          <View style={styles.buttonContainer}>
            <AnimatedButton
              title="Sucesso"
              variant="primary"
              onPress={() => feedbackAnimation.showSuccess()}
            />
            <AnimatedButton
              title="Erro"
              variant="primary"
              onPress={() => feedbackAnimation.showError()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666666',
  },
});

export default AnimationExamples;