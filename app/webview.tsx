import React from 'react';
import { StyleSheet, View, Platform, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAppBack } from '@/hooks/useAppBack';
import { WebViewErrorBoundary } from '@/components/ErrorBoundary';

export default function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const Colors = useColors();
  const handleBack = useAppBack();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const webViewUrl = url || 'https://lukashvelidze.github.io/unipilot/';
  const screenTitle = title || 'UniPilot';

  if (Platform.OS === 'web') {
    // On web, open in a new tab/window
    React.useEffect(() => {
      window.open(webViewUrl, '_blank');
      handleBack();
    }, [webViewUrl, handleBack]);

    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Stack.Screen
          options={{
            title: screenTitle,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
      </View>
    );
  }

  return (
    <WebViewErrorBoundary>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Stack.Screen
          options={{
            title: screenTitle,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: Colors.background }]}>
            <AlertCircle size={48} color={Colors.error || '#FF3B30'} />
            <Text style={[styles.errorText, { color: Colors.text }]}>
              Failed to load page
            </Text>
            <Text style={[styles.errorSubtext, { color: Colors.lightText }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Colors.primary }]}
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}
            <WebView
              source={{ uri: webViewUrl }}
              style={styles.webview}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                setError(nativeEvent.description || 'Unknown error occurred');
                setIsLoading(false);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error:', nativeEvent);
                setError(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.description || 'Request failed'}`);
                setIsLoading(false);
              }}
            />
          </>
        )}
      </View>
    </WebViewErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
