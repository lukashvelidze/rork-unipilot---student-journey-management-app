import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function WebViewScreen() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const Colors = useColors();

  const webViewUrl = url || 'https://lukashvelidze.github.io/unipilot/';
  const screenTitle = title || 'UniPilot';

  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web, open in a new tab/window
      window.open(webViewUrl, '_blank');
      router.back();
    }
  }, [webViewUrl, router]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Stack.Screen
          options={{
            title: screenTitle,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webview}
        startInLoadingState={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});