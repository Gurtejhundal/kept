import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { clearSharedPayloads, useIncomingShare } from 'expo-sharing';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveCapture } from '@/lib/database';

const urlPattern = /https?:\/\/[^\s<>"')\]]+/i;

export default function HandleShareScreen() {
  const router = useRouter();
  const { resolvedSharedPayloads, isResolving } = useIncomingShare();
  const [manualText, setManualText] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const sharedText = useMemo(() => resolvedSharedPayloads.find((payload) => payload.contentType === 'text')?.value ?? '', [resolvedSharedPayloads]);
  const sharedImage = resolvedSharedPayloads.find((payload) => payload.contentType === 'image')?.contentUri ?? '';
  const captureText = manualText || sharedText;
  const destinationUrl = captureText.match(urlPattern)?.[0] ?? '';

  async function save() {
    if (!destinationUrl && !sharedImage) { setError('Add a web link or share an image.'); return; }
    setSaving(true);
    setError('');
    try {
      await saveCapture({ destinationUrl, imageUri: sharedImage || undefined, notes: notes.trim() || captureText.trim(), title: title.trim() || (destinationUrl ? `Saved from ${new URL(destinationUrl).hostname.replace(/^www\./, '')}` : 'Saved image') });
      clearSharedPayloads();
      router.replace('/');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kept could not save this capture.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View><Text style={styles.eyebrow}>QUICK CAPTURE</Text><Text accessibilityRole="header" style={styles.title}>Keep this for later</Text><Text style={styles.subtitle}>The local save completes first. Sync can happen afterward.</Text></View>
          {isResolving && <View style={styles.status}><ActivityIndicator color="#5661A8" /><Text>Reading the shared item…</Text></View>}
          {sharedImage ? <Image source={{ uri: sharedImage }} accessibilityLabel="Shared visual preview" alt="Shared visual preview" style={styles.preview} resizeMode="cover" /> : null}
          <View style={styles.field}><Text style={styles.label}>Link or shared text</Text><TextInput accessibilityLabel="Link or shared text" style={[styles.input, styles.multiline]} multiline value={captureText} onChangeText={setManualText} placeholder="Paste a link or message" placeholderTextColor="#777D88" /></View>
          <View style={styles.field}><Text style={styles.label}>Title</Text><TextInput accessibilityLabel="Title" style={styles.input} value={title} onChangeText={setTitle} placeholder="A title you will remember" placeholderTextColor="#777D88" /></View>
          <View style={styles.field}><Text style={styles.label}>Notes</Text><TextInput accessibilityLabel="Notes" style={[styles.input, styles.multiline]} multiline value={notes} onChangeText={setNotes} placeholder="Why did this catch your eye?" placeholderTextColor="#777D88" /></View>
          {error ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primaryButton, (pressed || saving) && styles.pressed]}><Text style={styles.primaryButtonText}>{saving ? 'Saving locally…' : 'Save to Kept'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#F4F5F8' }, content: { flexGrow: 1, padding: 20, gap: 18 },
  eyebrow: { color: '#606BAC', fontSize: 11, fontWeight: '800', letterSpacing: 1.7 }, title: { marginTop: 7, color: '#20232B', fontFamily: 'serif', fontSize: 42, lineHeight: 44 }, subtitle: { marginTop: 8, color: '#666C78', fontSize: 15, lineHeight: 22 },
  status: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: '#ECEEFA', borderRadius: 14 }, preview: { width: '100%', aspectRatio: 16 / 10, borderRadius: 20, backgroundColor: '#E6E8EE' },
  field: { gap: 7 }, label: { color: '#20232B', fontSize: 13, fontWeight: '700' }, input: { minHeight: 48, paddingHorizontal: 14, color: '#20232B', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9DCE4', borderRadius: 14, fontSize: 16 }, multiline: { minHeight: 92, paddingTop: 13, textAlignVertical: 'top' },
  error: { color: '#A94F56', fontSize: 14, lineHeight: 20 }, primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5661A8', borderRadius: 15 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, cancelButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#606BAC', fontSize: 15, fontWeight: '700' }, pressed: { opacity: 0.7 },
});
