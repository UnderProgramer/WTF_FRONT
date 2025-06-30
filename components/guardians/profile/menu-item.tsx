import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import * as OutlineIcons from 'react-native-heroicons/outline';

export type MenuItem = {
  title: string;
  icon: keyof typeof OutlineIcons;
  onPress?: () => void;
  danger?: boolean;
};

type MenuItemProps = {
  item: MenuItem;
  isLast?: boolean;
};

export default function MenuItem({item, isLast = false}: MenuItemProps) {
  const IconComponent = OutlineIcons[item.icon];

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        isLast && styles.lastMenuItem,
        item.danger && styles.dangerMenuItem,
      ]}
      onPress={item.onPress}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          <IconComponent size={24} color={item.danger ? '#FF4D4F' : 'black'} />
          <Text
            style={[
              styles.menuItemText,
              item.danger && styles.dangerMenuItemText,
            ]}>
            {item.title}
          </Text>
        </View>
        <OutlineIcons.ChevronRightIcon size={20} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    marginTop: 5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333333',
  },
  dangerMenuItemText: {
    color: '#FF4D4F',
  },
});
