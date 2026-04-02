import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle as SvgCircle, Rect } from 'react-native-svg';
import {
  getUserName,
  getUserAge,
  getUserHeight,
  getUserWeight,
  getItem,
  KEYS,
} from '@/lib/storage';
import type { FaceAnalysisResult } from '@/lib/anthropic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dowdouiybyxrwtoysbne.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2RvdWl5Ynl4cnd0b3lzYm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjEyOTcsImV4cCI6MjA5MDE5NzI5N30.2Tb0FsUOPGq9JHo0Uze7oI6E78mCeUEkNpuBttkqFMI';
const COACH_EDGE_URL = `${SUPABASE_URL}/functions/v1/coach-chat`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserContext {
  name: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  scanResult: FaceAnalysisResult | null;
}

function PlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SendIcon({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.35)';
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22 11 13 2 9l20-7z" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CoachBadgeIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SkinIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={12} cy={12} r={9} stroke="rgba(255,255,255,0.45)" strokeWidth={1.3} />
      <Path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5" stroke="rgba(255,255,255,0.7)" strokeWidth={1.3} strokeLinecap="round" />
      <SvgCircle cx={12} cy={12} r={1.8} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

function FaceFormIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" stroke="rgba(255,255,255,0.45)" strokeWidth={1.3} />
      <Path d="M8.5 14.5s1 2 3.5 2 3.5-2 3.5-2" stroke="rgba(255,255,255,0.7)" strokeWidth={1.3} strokeLinecap="round" />
      <SvgCircle cx={9} cy={10} r={1.2} fill="rgba(255,255,255,0.55)" />
      <SvgCircle cx={15} cy={10} r={1.2} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

function EyesIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="rgba(255,255,255,0.45)" strokeWidth={1.3} />
      <SvgCircle cx={12} cy={12} r={3} stroke="rgba(255,255,255,0.7)" strokeWidth={1.3} />
      <SvgCircle cx={12} cy={12} r={1.3} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

function RoutineIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={16} rx={3} stroke="rgba(255,255,255,0.45)" strokeWidth={1.3} />
      <Path d="M8 2v4M16 2v4M3 10h18" stroke="rgba(255,255,255,0.45)" strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M8 14h4M8 17h6" stroke="rgba(255,255,255,0.7)" strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

function TypingIndicator() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (sv: typeof dot1, delayMs: number) => {
      sv.value = withDelay(delayMs, withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.3, { duration: 380 })), -1, false));
    };
    pulse(dot1, 0);
    pulse(dot2, 150);
    pulse(dot3, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.typingBubble}>
      <Animated.View style={[styles.typingDot, s1]} />
      <Animated.View style={[styles.typingDot, s2]} />
      <Animated.View style={[styles.typingDot, s3]} />
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <Animated.View entering={FadeInUp.duration(260)} style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.aiBadge}>
          <CoachBadgeIcon size={14} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  delay: number;
}

function ActionCard({ icon, label, onPress, delay }: ActionCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(320)} style={styles.actionCardWrapper}>
      <Pressable style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]} onPress={onPress}>
        <View style={[styles.bracket, styles.bracketTL]} />
        <View style={[styles.bracket, styles.bracketTR]} />
        <View style={[styles.bracket, styles.bracketBL]} />
        <View style={[styles.bracket, styles.bracketBR]} />
        <View style={styles.actionCardIcon}>{icon}</View>
        <Text style={styles.actionCardLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function buildSystemPrompt(ctx: UserContext): string {
  const r = ctx.scanResult;
  const lines: string[] = [
    `You are the Peakd AI Skin Care Coach — a world-class, empathetic personal beauty and wellness coach embedded inside the Peakd app.`,
    ``,
    `Your role is to help users understand their facial analysis results, improve their appearance, build confidence, and develop sustainable routines. You are warm, direct, science-backed, and never generic. Every response should feel personally tailored to this specific user.`,
    ``,
    `## User Profile`,
  ];
  if (ctx.name) lines.push(`- Name: ${ctx.name}`);
  if (ctx.age) lines.push(`- Age: ${ctx.age}`);
  if (ctx.height) lines.push(`- Height: ${ctx.height}`);
  if (ctx.weight) lines.push(`- Weight: ${ctx.weight}`);
  if (r) {
    lines.push(``, `## Facial Analysis Results`);
    lines.push(`- Overall Glow Score: ${r.glowScore}/10`);
    if (r.archetype?.name) lines.push(`- Archetype: ${r.archetype.name}`);
    if (r.archetype?.description) lines.push(`- Archetype Description: ${r.archetype.description}`);
    lines.push(``, `## Feature Scores`);
    if (r.featureScores?.skinQuality) lines.push(`- Skin Quality: ${r.featureScores.skinQuality.score}/10 — ${r.featureScores.skinQuality.summary}`);
    if (r.featureScores?.facialStructure) lines.push(`- Facial Structure: ${r.featureScores.facialStructure.score}/10 — ${r.featureScores.facialStructure.summary}`);
    if (r.featureScores?.eyes) lines.push(`- Eyes: ${r.featureScores.eyes.score}/10 — ${r.featureScores.eyes.summary}`);
    if (r.featureScores?.nose) lines.push(`- Nose: ${r.featureScores.nose.score}/10 — ${r.featureScores.nose.summary}`);
    if (r.featureScores?.lipsAndMouth) lines.push(`- Lips & Mouth: ${r.featureScores.lipsAndMouth.score}/10 — ${r.featureScores.lipsAndMouth.summary}`);
    if (r.featureScores?.eyebrows) lines.push(`- Eyebrows: ${r.featureScores.eyebrows.score}/10 — ${r.featureScores.eyebrows.summary}`);
    if (r.featureScores?.hair) lines.push(`- Hair: ${r.featureScores.hair.score}/10 — ${r.featureScores.hair.summary}`);
    if (r.featureScores?.overallHarmony) lines.push(`- Overall Harmony: ${r.featureScores.overallHarmony.score}/10 — ${r.featureScores.overallHarmony.summary}`);
    if (r.topStrength) { lines.push(``, `## Top Strength`, `- Feature: ${r.topStrength.feature}`, `- Insight: ${r.topStrength.insight}`); }
    if (r.topOpportunity) { lines.push(``, `## Top Opportunity`, `- Feature: ${r.topOpportunity.feature}`, `- Insight: ${r.topOpportunity.insight}`); }
    if (r.recommendations?.length) {
      lines.push(``, `## Personalised Recommendations`);
      r.recommendations.slice(0, 5).forEach((rec, i) => { lines.push(`${i + 1}. ${rec.title} (${rec.category}, ${rec.timeframe}): ${rec.action}`); });
    }
    if (r.personalNote) lines.push(``, `## Personal Note`, r.personalNote);
    if (r.uniqueDetail) lines.push(``, `## Unique Detail`, r.uniqueDetail);
    if (r.first_observation) lines.push(``, `## First Observation`, r.first_observation);
    if (r.eyes_insight) lines.push(``, `## Eyes Insight`, r.eyes_insight);
    if (r.skin_insight) lines.push(``, `## Skin Insight`, r.skin_insight);
    if (r.structure_insight) lines.push(``, `## Structure Insight`, r.structure_insight);
    if (r.strongest_feature) lines.push(``, `## Strongest Feature`, `${r.strongest_feature}: ${r.strongest_feature_insight ?? ''}`);
  } else {
    lines.push(``, `## Facial Analysis Results`, `No scan results available yet. Encourage the user to complete their first scan.`);
  }
  lines.push(
    ``, `## Coaching Guidelines`,
    `- Always reference the user's actual scores, archetype, and insights when relevant.`,
    `- Be specific: name exact products, ingredients, exercises, or techniques.`,
    `- Prioritise actionable advice over general statements.`,
    `- Frame improvements positively — focus on unlocking potential, not fixing flaws.`,
    `- Keep responses concise (2–4 short paragraphs max) unless the user asks for a detailed plan.`,
    `- Use the user's first name occasionally.`,
    `- Never fabricate scan data. If a score is not available, say so naturally.`,
  );
  return lines.join('\n');
}

export default function CoachScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [userCtx, setUserCtx] = useState<UserContext>({ name: null, age: null, height: null, weight: null, scanResult: null });

  useEffect(() => {
    (async () => {
      const [name, age, height, weight, scanResult] = await Promise.all([
        getUserName(), getUserAge(), getUserHeight(), getUserWeight(),
        getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
      ]);
      setUserCtx({ name, age, height, weight, scanResult: scanResult ?? null });
    })();
  }, []);

  const quickPromptsRow1 = [
    "What's my actual skin type?",
    "What's my hidden dating advantage?",
    "Who do I naturally attract?",
    "What are the best products for my skin?",
    "What do I overestimate most?",
  ];
  const quickPromptsRow2 = [
    "Why does my face look inconsistent?",
    "How can I improve my Glow Score?",
    "Build me a morning routine",
    "What's my biggest strength?",
    "How do I improve my jawline?",
  ];

  const actionCards = [
    { icon: <SkinIcon />, label: 'Analyse my skin', prompt: 'Give me a deep analysis of my skin quality score and exactly what I should do to improve it.' },
    { icon: <FaceFormIcon />, label: 'Face structure', prompt: 'Explain my facial structure score and what it means for my overall attractiveness and presence.' },
    { icon: <EyesIcon />, label: 'Eye area tips', prompt: 'What can I do to improve the appearance of my eye area based on my specific scores and analysis?' },
    { icon: <RoutineIcon />, label: 'Build my routine', prompt: 'Create a personalised daily routine to help me improve my Glow Score over the next 30 days. Be specific.' },
  ];

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    Keyboard.dismiss();
    setInputText('');
    setHasStartedChat(true);
    const userMsg: Message = { id: `${Date.now()}-u`, role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const systemPrompt = buildSystemPrompt(userCtx);
      let aiContent: string;
      try {
        const res = await fetch(COACH_EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({ systemPrompt, messages: history }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        aiContent = data?.reply ?? data?.content ?? data?.message ?? "I'm having trouble connecting right now.";
      } catch {
        const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
        if (!openaiKey) throw new Error('No AI backend available');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, ...history], max_tokens: 600, temperature: 0.75 } ),
        });
        const data = await res.json();
        aiContent = data?.choices?.[0]?.message?.content ?? "I'm having trouble connecting right now.";
      }
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: 'assistant', content: aiContent, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { id: `${Date.now()}-err`, role: 'assistant', content: "I couldn't connect right now. Check your connection and try again.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages, isTyping, userCtx]);

  function handleSend() { sendMessage(inputText); }
  const canSend = inputText.trim().length > 0 && !isTyping;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.navBar}>
          <View style={styles.navLeft} />
          <View style={styles.navCenter}>
            <View style={styles.navIconBg}><CoachBadgeIcon size={16} /></View>
            <Text style={styles.navTitle}>AI Skin Care Coach</Text>
          </View>
          <View style={styles.navRight} />
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={[styles.messageListContent, !hasStartedChat && styles.messageListFlex]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => { if (hasStartedChat) scrollRef.current?.scrollToEnd({ animated: true }); }}
        >
          {!hasStartedChat ? (
            <Animated.View entering={FadeIn.duration(350)} style={styles.emptyState}>
              <Text style={styles.emptyTitle}>See if it's right for you</Text>
              <View style={styles.actionGrid}>
                {actionCards.map((card, i) => (
                  <ActionCard key={card.label} icon={card.icon} label={card.label} onPress={() => sendMessage(card.prompt)} delay={i * 55} />
                ))}
              </View>
              <Text style={styles.orPickPrompt}>or pick a prompt</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
                {quickPromptsRow1.map((p) => (
                  <Pressable key={p} style={({ pressed }) => [styles.promptChip, pressed && styles.promptChipPressed]} onPress={() => sendMessage(p)}>
                    <Text style={styles.promptChipText}>{p}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipsRow, { marginTop: 8 }]} contentContainerStyle={styles.chipsContent}>
                {quickPromptsRow2.map((p) => (
                  <Pressable key={p} style={({ pressed }) => [styles.promptChip, pressed && styles.promptChipPressed]} onPress={() => sendMessage(p)}>
                    <Text style={styles.promptChipText}>{p}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          ) : (
            <>
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {isTyping && (
                <Animated.View entering={FadeIn.duration(200)} style={[styles.bubbleRow, styles.bubbleRowAI]}>
                  <View style={styles.aiBadge}><CoachBadgeIcon size={14} /></View>
                  <TypingIndicator />
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
        <View style={styles.inputBarWrapper}>
          <View style={styles.inputBar}>
            <Pressable style={styles.plusBtn} hitSlop={8}><PlusIcon /></Pressable>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type your message"
              placeholderTextColor="rgba(255,255,255,0.28)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable style={[styles.sendBtn, canSend && styles.sendBtnActive]} onPress={handleSend} disabled={!canSend}>
              {isTyping ? <ActivityIndicator size="small" color="rgba(255,255,255,0.45)" /> : <SendIcon active={canSend} />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  flex: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  navLeft: { width: 36 },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navIconBg: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#ffffff', letterSpacing: -0.3 },
  navRight: { width: 36 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  messageListFlex: { flexGrow: 1 },
  emptyState: { flex: 1 },
  emptyTitle: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 18, letterSpacing: 0.1 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 },
  actionCardWrapper: { width: (SCREEN_WIDTH - 32 - 10) / 2 },
  actionCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 118, position: 'relative' },
  actionCardPressed: { backgroundColor: 'rgba(255,255,255,0.13)' },
  bracket: { position: 'absolute', width: 13, height: 13, borderColor: 'rgba(255,255,255,0.28)' },
  bracketTL: { top: 9, left: 9, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopLeftRadius: 3 },
  bracketTR: { top: 9, right: 9, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopRightRadius: 3 },
  bracketBL: { bottom: 9, left: 9, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomLeftRadius: 3 },
  bracketBR: { bottom: 9, right: 9, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 3 },
  actionCardIcon: { marginBottom: 10 },
  actionCardLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.80)', textAlign: 'center', letterSpacing: -0.1 },
  orPickPrompt: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginBottom: 12, letterSpacing: 0.1 },
  chipsRow: { flexGrow: 0 },
  chipsContent: { gap: 8, paddingRight: 4 },
  promptChip: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)', paddingVertical: 9, paddingHorizontal: 15, maxWidth: 200 },
  promptChipPressed: { backgroundColor: 'rgba(255,255,255,0.15)' },
  promptChipText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.72)', lineHeight: 17 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAI: { justifyContent: 'flex-start' },
  aiBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
  bubble: { maxWidth: SCREEN_WIDTH * 0.72, borderRadius: 18, paddingVertical: 11, paddingHorizontal: 15 },
  bubbleUser: { backgroundColor: '#2563eb', borderBottomRightRadius: 5 },
  bubbleAI: { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bubbleTextUser: { color: '#ffffff' },
  bubbleTextAI: { color: 'rgba(255,255,255,0.88)' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, borderBottomLeftRadius: 5, paddingVertical: 14, paddingHorizontal: 18 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  inputBarWrapper: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 90, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0a0a0a' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', paddingLeft: 6, paddingRight: 6, paddingVertical: 6, gap: 4 },
  plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '400', color: '#ffffff', paddingHorizontal: 8, paddingVertical: 8, maxHeight: 120, lineHeight: 20 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnActive: { backgroundColor: '#2563eb', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.55, shadowRadius: 8, elevation: 4 },
});
