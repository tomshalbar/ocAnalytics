const light = {
  background: "#F6F7F9",
  surface: "#FFFFFF",
  text: "#17202C",
  muted: "#586576",
  border: "#DEE3EA",
  accent: "#265BC0",
  accentSurface: "#EAF0FD",
  quiet: "#236548",
  quietSurface: "#E8F4EC",
  moderate: "#805411",
  moderateSurface: "#FFF3DB",
  busy: "#A13340",
  busySurface: "#FCECEF",
};

export type AppColors = { [Key in keyof typeof light]: string };

const dark: AppColors = {
  background: "#11161E",
  surface: "#1B2330",
  text: "#F0F3F8",
  muted: "#ADB9CA",
  border: "#354154",
  accent: "#A3BFFF",
  accentSurface: "#243656",
  quiet: "#9ED8B5",
  quietSurface: "#213B30",
  moderate: "#F0CD87",
  moderateSurface: "#40341F",
  busy: "#FFB1BB",
  busySurface: "#462A32",
};

export const colors = { light, dark };
