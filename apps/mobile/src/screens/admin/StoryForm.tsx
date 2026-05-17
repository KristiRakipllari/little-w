import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useStoryStore } from "@/store/storyStore";
import { COLORS, DIFFICULTY_LEVELS, DIFFICULTY_LABELS } from "@calm-stories/shared";
import type { DifficultyLevel } from "@calm-stories/shared";
import type { RootStackParamList } from "@/navigation/Navigator";

type RouteType = RouteProp<RootStackParamList, "StoryForm">;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function StoryForm() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { currentStory, isLoading, fetchStory, createStory, updateStory } =
    useStoryStore();

  const storyId = route.params?.storyId;
  const isEditing = !!storyId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<DifficultyLevel>("beginner");
  const [isPremium, setIsPremium] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storyId) {
      fetchStory(storyId);
    }
  }, [storyId]);

  useEffect(() => {
    if (currentStory && isEditing) {
      setTitle(currentStory.title);
      setDescription(currentStory.description);
      setLevel(currentStory.level);
      setIsPremium(currentStory.is_premium);
    }
  }, [currentStory]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      if (isEditing && storyId) {
        await updateStory(storyId, { title, description, level, is_premium: isPremium });
        navigation.goBack();
      } else {
        const story = await createStory({
          title,
          description,
          level,
          is_premium: isPremium,
        });
        navigation.replace("PageEditor", { storyId: story.id });
      }
    } catch {
      // error handled by store
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.admin.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>Story Details</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Good Morning Routine"
        placeholderTextColor={COLORS.admin.textLight}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What is this story about?"
        placeholderTextColor={COLORS.admin.textLight}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Difficulty Level</Text>
      <View style={styles.levelRow}>
        {DIFFICULTY_LEVELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.levelBtn, level === l && styles.levelBtnActive]}
            onPress={() => setLevel(l)}
          >
            <Text
              style={[
                styles.levelBtnText,
                level === l && styles.levelBtnTextActive,
              ]}
            >
              {DIFFICULTY_LABELS[l]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Premium Content</Text>
        <Switch
          value={isPremium}
          onValueChange={setIsPremium}
          trackColor={{ true: COLORS.admin.primary }}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || !title.trim()}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveText}>
            {isEditing ? "Save Changes" : "Create & Add Pages"}
          </Text>
        )}
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity
          style={styles.editPagesButton}
          onPress={() => navigation.navigate("PageEditor", { storyId: storyId! })}
        >
          <Text style={styles.editPagesText}>
            Edit Pages ({currentStory?.page_count || 0})
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.admin.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.admin.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.admin.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.admin.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.admin.surface,
    borderWidth: 1,
    borderColor: COLORS.admin.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.admin.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.admin.border,
    alignItems: "center",
    backgroundColor: COLORS.admin.surface,
  },
  levelBtnActive: {
    backgroundColor: COLORS.admin.primary,
    borderColor: COLORS.admin.primary,
  },
  levelBtnText: {
    fontSize: 14,
    color: COLORS.admin.textLight,
    fontWeight: "500",
  },
  levelBtnTextActive: {
    color: "#FFF",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: COLORS.admin.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  editPagesButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.admin.primary,
  },
  editPagesText: {
    color: COLORS.admin.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
