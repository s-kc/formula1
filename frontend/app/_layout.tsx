import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#15151E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#0c0c0c',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Formula 1 Tracker',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="standings"
          options={{
            title: 'Championship Standings',
          }}
        />
        <Stack.Screen
          name="schedule"
          options={{
            title: 'Race Schedule',
          }}
        />
        <Stack.Screen
          name="drivers"
          options={{
            title: 'Drivers',
          }}
        />
        <Stack.Screen
          name="teams"
          options={{
            title: 'Teams',
          }}
        />
        <Stack.Screen
          name="driver/[id]"
          options={{
            title: 'Driver Details',
          }}
        />
        <Stack.Screen
          name="team/[id]"
          options={{
            title: 'Team Details',
          }}
        />
      </Stack>
    </>
  );
}
