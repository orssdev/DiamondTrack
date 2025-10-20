import { Tabs, useNavigation, usePathname } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';


export default function TabLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  
  useEffect(() => {
    // Map pathname to header title
    let title = 'Diamond Track';
    if (pathname.endsWith('/')) title = 'Game';
    else if (pathname.endsWith('/about')) title = 'About';
    else if (pathname.endsWith('/stats')) title = 'Stats';

    navigation.setOptions({ headerTitle: title });
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffd33d',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Game',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'baseball' : 'baseball-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}
