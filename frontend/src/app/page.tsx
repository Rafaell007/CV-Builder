import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function Home() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        CV Builder
      </Typography>
      <Button variant="contained">Material UI works</Button>
    </Container>
  );
}
