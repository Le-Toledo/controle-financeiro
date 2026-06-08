import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import type { Category, CategoryType } from '@shared/types/category';

interface CategoryPickerProps {
  categories:  Category[];
  selectedId:  string | null;
  type:        CategoryType;
  onSelect:    (category: Category) => void;
}

export function CategoryPicker({ categories, selectedId, type, onSelect }: CategoryPickerProps) {
  const filtered = categories.filter((c) => c.type === type);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {filtered.map((cat) => {
        const selected = cat.id === selectedId;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={cat.name}
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              selected && { backgroundColor: cat.color + '22', borderColor: cat.color },
            ]}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={[styles.label, selected && { color: cat.color }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, flexDirection: 'row' },

  chip: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: Spacing.md,
    paddingVertical:   10,
    borderRadius:   Radius.full,
    backgroundColor: Colors.card,
    borderWidth:    1,
    borderColor:    Colors.border,
    minHeight:      44,
  },

  icon:  { fontSize: 16 },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    color:      Colors.textSecondary,
  },
});
