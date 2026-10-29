import { useLoginStyles } from '../design-system/login-styles';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Brand, Button, Field, LanguageSwitch } from '../design-system/legacy-ui';
import { errorText } from '../lib/translations';
import type { SessionState } from '../lib/use-session';
import { api } from '../lib/api';

export function Login({
  session,
  activation,
  onActivated,
}: {
  session: SessionState;
  activation?: string;
  onActivated: () => void;
}) {
  const styles = useLoginStyles();
  const { copy, locale, changeLocale } = session;
  const wide = useWindowDimensions().width >= 1000;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (activation) {
        if (password.length < 12) {
          setError('shortPassword');
          return;
        }
        await api('/auth/activate', 'POST', { token: activation, password });
        setPassword('');
        setSuccess(true);
        onActivated();
      } else await session.login(email, password);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'SERVER_ERROR');
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {wide && (
        <View style={styles.story}>
          <Brand light />
          <View style={styles.storyContent}>
            <View style={styles.illustration}>
              <View style={styles.arch}>
                <View style={styles.door} />
              </View>
              <View style={styles.sun} />
              <View style={styles.plant}>
                <View style={styles.leaf} />
                <View style={[styles.leaf, styles.leafOther]} />
                <View style={styles.pot} />
              </View>
              <View style={styles.floor} />
            </View>
            <Text style={styles.tagline}>{copy.tagline}</Text>
            <Text style={styles.storyText}>{copy.story}</Text>
          </View>
          <Text style={styles.storyFoot}>HOTELIVA · {copy.workspace}</Text>
        </View>
      )}
      <ScrollView
        style={styles.formPane}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.top}>
          {!wide ? <Brand /> : <View />}
          <LanguageSwitch locale={locale} onChange={changeLocale} />
        </View>
        <View style={styles.form}>
          <Text style={styles.eyebrow}>HOTELIVA {copy.workspace}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {activation ? copy.activate : copy.welcome}
          </Text>
          <Text style={styles.subtitle}>{activation ? copy.activateHint : copy.subtitle}</Text>
          <View style={styles.fields}>
            {!activation && (
              <Field
                label={copy.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                placeholder="nev@hotel.hu"
              />
            )}
            <Field
              label={copy.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={activation ? 'new-password' : 'current-password'}
              onSubmitEditing={() => void submit()}
              returnKeyType="go"
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisible(!visible)}
              style={styles.reveal}
            >
              <Text style={styles.revealText}>
                {visible ? copy.hidePassword : copy.showPassword}
              </Text>
            </Pressable>
            {Boolean(error || session.notice) && (
              <Text accessibilityRole="alert" style={styles.error}>
                {errorText(copy, error || session.notice)}
              </Text>
            )}
            {success && (
              <Text accessibilityRole="alert" style={styles.success}>
                {copy.activated}
              </Text>
            )}
            <Button
              title={busy ? copy.working : activation ? copy.activateAction : copy.login}
              disabled={busy || !password || (!activation && !email)}
              onPress={() => void submit()}
            />
          </View>
          {!activation && (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>{copy.or}</Text>
                <View style={styles.line} />
              </View>
              <Button
                title={`G   ${copy.google} · ${copy.soon}`}
                secondary
                disabled
                onPress={() => {}}
              />
              <View style={styles.invite}>
                <Text style={styles.inviteTitle}>{copy.inviteOnly}</Text>
                <Text style={styles.inviteText}>{copy.inviteHint}</Text>
              </View>
            </>
          )}
          {activation && (
            <Pressable accessibilityRole="button" onPress={onActivated} style={styles.back}>
              <Text style={styles.revealText}>{copy.back}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.footer}>Hoteliva</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
