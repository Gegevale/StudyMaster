import React, { useState } from 'react';
import {
  StyleSheet, Text, View, StatusBar, TextInput, Platform, Pressable, ScrollView,
  ActivityIndicator, Alert, Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configura o manipulador de notificações para exibir uma notificação
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // Estados para armazenar o token push, os canais de notificação e a notificação atual
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState(undefined);

  // Referências para os ouvintes de notificações e respostas
  const notificationListener = useRef();
  const responseListener = useRef();

  // Efeito de gancho para registrar a notificação push, obter canais (Android) e definir os ouvintes
  useEffect(() => {
    // Registra a notificação push e define o token no estado
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    // Obtém os canais de notificação para Android
    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then(value => setChannels(value));
    }

    // Define o ouvinte para notificações recebidas
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Define o ouvinte para respostas de notificações
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    // Limpa os ouvintes ao desmontar o componente
    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []); // A dependência vazia [] garante que o efeito é executado apenas uma vez

  // Renderiza o componente
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
      <Text>Seu expo push token: {expoPushToken}</Text>
      <Text>{`Canal: ${JSON.stringify(
        channels.map(c => c.id),
        null,
        2
      )}`}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Título: {notification && notification.request.content.title} </Text>
        <Text>Conteúdo: {notification && notification.request.content.body}</Text>
        <Text>Dados: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button
        title="Pressione para enviar uma notificação"
        onPress={async () => {
          await schedulePushNotification();
        }}
      />
    </View>
  );
}

// Função para agendar uma notificação push
async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Você tem um novo e-mail! 📬",
      body: 'Aqui fica o conteúdo da notificação',
      data: { data: 'goes here', test: { test1: 'outros dados' } },
    },
    trigger: { seconds: 2 }, // Executa a notificação após 2 segundos
  });
}

// Função para registrar a notificação push
async function registerForPushNotificationsAsync() {
  let token;

  // Configura o canal padrão para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Verifica se o dispositivo é físico
  if (Device.isDevice) {
    // Obtém as permissões de notificação existentes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Solicita permissões se não forem concedidas
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Se as permissões não forem concedidas, exibe um alerta
    if (finalStatus !== 'granted') {
      alert('Falha no push token para push notification!');
      return;
    }

    // Obtém o token push do Expo
    try {
      // Obtém o ID do projeto do Expo
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      // Verifica se o ID do projeto é encontrado
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      // Obtém o token push
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  // Retorna o token push
  return token;
}

const statusBarHeight = StatusBar.currentHeight;
const KEY_GPT = '';

export default function App() {
  const [nivel, setNivel] = useState("");
  const [hours, setHours] = useState(2);
  const [materias, setMaterias] = useState("");
  const [loading, setLoading] = useState(false);
  const [travel, setTravel] = useState("");

  async function handleGenerate() {
    if (nivel === "") {
      Alert.alert("Atenção", "Preencha seu nível de ensino");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    const prompt = `Crie um roteiro de estudos de uma semana tendo dois dias (final de semana) de descanso, sendo que o estudante possui ${hours.toFixed(0)} horas disponíveis por dia para estudar, os assuntos devem estar adequados ao nível de ensino do ${nivel}, o cronograma deve conter as matérias ${materias}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KEY_GPT}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.20,
          max_tokens: 500,
          top_p: 1,
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setTravel(data.choices[0].message.content);
      } else {
        throw new Error("Invalid response from AI model");
      }
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Erro", "Ocorreu um erro ao gerar o roteiro. Por favor, tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="#F1F1F1" />
      <Text style={styles.heading}>STUDY MASTER</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nível de ensino</Text>
        <TextInput
          placeholder="Ex: 1° ano do Ensino Médio"
          style={styles.input}
          value={nivel}
          onChangeText={(text) => setNivel(text)}
        />

        <Text style={styles.label}>Horas disponíveis: {hours.toFixed(0)}</Text>
        <Slider
          style={{ width: '100%', marginBottom: 16 }}
          minimumValue={1}
          maximumValue={7}
          minimumTrackTintColor="#009688"
          maximumTrackTintColor="#000000"
          value={hours}
          onValueChange={(value) => setHours(value)}
        />

        <View style={styles.form}>
          <Text style={styles.label}>Matérias</Text>
          <TextInput
            placeholder="Ex: Matemática, Geografia, História"
            style={styles.input}
            value={materias}
            onChangeText={(text) => setMaterias(text)}
          />
        </View>

        <Pressable style={styles.button} onPress={handleGenerate}>
          <Text style={styles.buttonText}>Gerar roteiro</Text>
          <MaterialIcons name="travel-explore" size={24} color="#FFF" />
        </Pressable>

        <ScrollView contentContainerStyle={styles.containerScroll} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.content}>
              <Text style={styles.title}>Carregando roteiro...</Text>
              <ActivityIndicator color="#000" size="large" />
            </View>
          )}

          {travel && (
            <View style={styles.content}>
              <Text style={styles.title}>Roteiro da viagem 👇</Text>
              <Text style={{ lineHeight: 24 }}>{travel}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    paddingTop: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingTop: Platform.OS === 'android' ? statusBarHeight : 54,
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#FFF',
    width: '90%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#94a3b8',
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF5656',
    width: '90%',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  content: {
    backgroundColor: '#FFF',
    padding: 16,
    width: '100%',
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  containerScroll: {
    width: '100%',
  },
});
