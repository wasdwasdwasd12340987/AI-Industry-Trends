import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout, ThemeProvider, SimpleViewProvider } from "./components/layout";
import { Home } from "./pages/home";
import { Compare } from "./pages/compare";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/compare" component={Compare} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SimpleViewProvider>
          <Router />
        </SimpleViewProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
