import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStoryStore } from "@/store/storyStore";
import { useAuthStore } from "@/store/authStore";
import { COLORS, DIFFICULTY_LABELS } from "@calm-stories/shared";
import type { Story } from "@calm-stories/shared";
import type { RootStackParamList } from "@/navigation/Navigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function Dashboard() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { stories, isLoading, fetchStories, deleteStory, updateStory } =
    useStoryStore();
  const { user, logout, setMode } = useAuthStore();

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDelete = (story: Story) => {
    Alert.alert(
      "Delete Story",
      `Are you sure you want to delete "${story.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteStory(story.id),
        },
      ]
    );
  };

  const togglePublish = (story: Story) => {
    updateStory(story.id, { is_published: !story.is_published });
  };

  const renderStoryRow = ({ item }: { item: Story }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowContent}
        onPress={() => navigation.navigate("StoryForm", { storyId: item.id })}
      >
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.badges}>
            {item.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.badgeText}>Premium</Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                item.is_published ? styles.publishedBadge : styles.draftBadge,
              ]}
            >
              <Text style={styles.badgeText}>
                {item.is_published ? "Published" : "Draft"}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.rowMeta}>
          {DIFFICULTY_LABELS[item.level]} · {item.page_count} pages
        </Text>
      </TouchableOpacity>

      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate("PageEditor", { storyId: item.id })
          }
        >
          <Text style={styles.actionText}>📝</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => togglePublish(item)}
        >
          <Text style={styles.actionText}>
            {item.is_published ? "📤" : "📥"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate("StoryPlayer", { storyId: item.id })
          }
        >
          <Text style={styles.actionText}>👁️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Stories</Text>
          <Text style={styles.headerSub}>
            {user?.name} · {stories.length} stories
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setMode("child")}
          >
            <Text style={styles.switchText}>Child View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate("StoryForm", {})}
      >
        <Text style={styles.createText}>+ New Story</Text>
      </TouchableOpacity>

      {/* Story list */}
      {isLoading && stories.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.admin.primary} />
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={renderStoryRow}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.admin.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    backgroundColor: COLORS.admin.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.admin.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.admin.text,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.admin.textLight,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  switchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.admin.primary,
  },
  switchText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.admin.border,
  },
  logoutText: {
    color: COLORS.admin.textLight,
    fontSize: 13,
  },
  createButton: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.admin.primary,
    alignItems: "center",
  },
  createText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    backgroundColor: COLORS.admin.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.admin.border,
  },
  rowContent: {
    padding: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.admin.text,
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 4,
  },
  premiumBadge: {
    backgroundColor: "#F2C87E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: "#C8E6C9",
  },
  draftBadge: {
    backgroundColor: "#E0E0E0",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  rowMeta: {
    fontSize: 13,
    color: COLORS.admin.textLight,
  },
  rowActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.admin.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionText: {
    fontSize: 18,
  },
});
