// vite.config.ts
import { defineConfig } from "file:///C:/Users/User/Documents/ClientIO/joint-plus-master/projects/joint/node_modules/vitest/dist/config.js";
import { externalizeDeps } from "file:///C:/Users/User/Documents/ClientIO/joint-plus-master/projects/joint/node_modules/vite-plugin-externalize-deps/dist/index.js";
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      fileName: "index"
    },
    rollupOptions: {
      external: [/^node:.*$/],
      output: [
        {
          esModule: true,
          exports: "named",
          format: "es"
        },
        {
          exports: "named",
          format: "cjs",
          inlineDynamicImports: true,
          interop: "auto"
        }
      ]
    },
    sourcemap: true,
    target: "esnext"
  },
  plugins: [
    externalizeDeps()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERvY3VtZW50c1xcXFxDbGllbnRJT1xcXFxqb2ludC1wbHVzLW1hc3RlclxcXFxwcm9qZWN0c1xcXFxqb2ludFxcXFxwYWNrYWdlc1xcXFxqb2ludC12aXRlc3QtcGx1Z2luLW1vY2stc3ZnXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERvY3VtZW50c1xcXFxDbGllbnRJT1xcXFxqb2ludC1wbHVzLW1hc3RlclxcXFxwcm9qZWN0c1xcXFxqb2ludFxcXFxwYWNrYWdlc1xcXFxqb2ludC12aXRlc3QtcGx1Z2luLW1vY2stc3ZnXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9Vc2VyL0RvY3VtZW50cy9DbGllbnRJTy9qb2ludC1wbHVzLW1hc3Rlci9wcm9qZWN0cy9qb2ludC9wYWNrYWdlcy9qb2ludC12aXRlc3QtcGx1Z2luLW1vY2stc3ZnL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFZpdGVVc2VyQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XHJcbmltcG9ydCB7IGV4dGVybmFsaXplRGVwcyB9IGZyb20gJ3ZpdGUtcGx1Z2luLWV4dGVybmFsaXplLWRlcHMnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBidWlsZDoge1xyXG4gICAgbGliOiB7XHJcbiAgICAgIGVudHJ5OiAnLi9zcmMvaW5kZXgudHMnLFxyXG4gICAgICBmaWxlTmFtZTogJ2luZGV4JyxcclxuICAgIH0sXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGV4dGVybmFsOiBbL15ub2RlOi4qJC9dLFxyXG4gICAgICBvdXRwdXQ6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBlc01vZHVsZTogdHJ1ZSxcclxuICAgICAgICAgIGV4cG9ydHM6ICduYW1lZCcsXHJcbiAgICAgICAgICBmb3JtYXQ6ICdlcycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBleHBvcnRzOiAnbmFtZWQnLFxyXG4gICAgICAgICAgZm9ybWF0OiAnY2pzJyxcclxuICAgICAgICAgIGlubGluZUR5bmFtaWNJbXBvcnRzOiB0cnVlLFxyXG4gICAgICAgICAgaW50ZXJvcDogJ2F1dG8nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIGV4dGVybmFsaXplRGVwcygpLFxyXG4gIF0gYXMgVml0ZVVzZXJDb25maWdbXCJwbHVnaW5zXCJdLFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyZixTQUFTLG9CQUF5QztBQUM3aUIsU0FBUyx1QkFBdUI7QUFHaEMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTztBQUFBLE1BQ1AsVUFBVTtBQUFBLElBQ1o7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxXQUFXO0FBQUEsTUFDdEIsUUFBUTtBQUFBLFFBQ047QUFBQSxVQUNFLFVBQVU7QUFBQSxVQUNWLFNBQVM7QUFBQSxVQUNULFFBQVE7QUFBQSxRQUNWO0FBQUEsUUFDQTtBQUFBLFVBQ0UsU0FBUztBQUFBLFVBQ1QsUUFBUTtBQUFBLFVBQ1Isc0JBQXNCO0FBQUEsVUFDdEIsU0FBUztBQUFBLFFBQ1g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLGdCQUFnQjtBQUFBLEVBQ2xCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
