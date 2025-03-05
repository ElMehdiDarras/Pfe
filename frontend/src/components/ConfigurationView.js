import React, { useState } from 'react';
import { 
  Container, Typography, Paper, Box, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useData } from '../context/DataProvider';

function ConfigurationView() {
  const [activeTab, setActiveTab] = useState(0);
  const { sites, loading } = useData();
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="div">
        Configuration
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Sites" />
            <Tab label="Boxes" />
            <Tab label="Equipements" />
            <Tab label="Utilisateurs" />
            <Tab label="Notifications" />
          </Tabs>
        </Box>
        
        {/* Sites tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Ajouter un Site
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom du Site</TableCell>
                    <TableCell>VLAN</TableCell>
                    <TableCell>Adresse IP</TableCell>
                    <TableCell>Emplacement</TableCell>
                    <TableCell>Nombre de Boxes</TableCell>
                    <TableCell>Nombre d'Équipements</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>{site.name}</TableCell>
                      <TableCell>{site.vlan}</TableCell>
                      <TableCell>{site.ipRange}</TableCell>
                      <TableCell>{site.location}</TableCell>
                      <TableCell>{site.boxes ? site.boxes.length : 0}</TableCell>
                      <TableCell>{site.equipment ? site.equipment.length : 0}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<EditIcon />}>
                          Éditer
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon />}>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Boxes tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Ajouter une Box
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Adresse IP</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sites.flatMap(site => 
                    (site.boxes || []).map(box => ({...box, site: site.name}))
                  ).map((box, index) => (
                    <TableRow key={index}>
                      <TableCell>{box.name}</TableCell>
                      <TableCell>{box.ip}</TableCell>
                      <TableCell>161</TableCell>
                      <TableCell>{box.site}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<EditIcon />}>
                          Éditer
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon />}>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Equipements tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Ajouter un Équipement
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Box</TableCell>
                    <TableCell>Pin</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sites.flatMap(site => 
                    (site.equipment || []).map(equip => ({...equip, site: site.name}))
                  ).map((equip, index) => (
                    <TableRow key={index}>
                      <TableCell>{equip.name}</TableCell>
                      <TableCell>{equip.type}</TableCell>
                      <TableCell>{equip.site}</TableCell>
                      <TableCell>{`Box Alarme-${Math.floor(index/6) + 1}`}</TableCell>
                      <TableCell>{`PIN_${String(index % 12 + 1).padStart(2, '0')}`}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<EditIcon />}>
                          Éditer
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon />}>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Utilisateurs tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Ajouter un Utilisateur
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom d'utilisateur</TableCell>
                    <TableCell>Type d'accès</TableCell>
                    <TableCell>Sites autorisés</TableCell>
                    <TableCell>Dernière connexion</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>admin</TableCell>
                    <TableCell>Administrateur</TableCell>
                    <TableCell>Tous</TableCell>
                    <TableCell>{new Date().toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>iam</TableCell>
                    <TableCell>Superviseur</TableCell>
                    <TableCell>Tous</TableCell>
                    <TableCell>{new Date().toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>rabat_iam</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Rabat-Hay NAHDA, Rabat-Soekarno</TableCell>
                    <TableCell>{new Date(Date.now() - 86400000).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>casa_iam</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Casa-Nations Unies</TableCell>
                    <TableCell>{new Date(Date.now() - 172800000).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Notifications tab */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Ajouter une Notification
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Destinataire</TableCell>
                    <TableCell>Niveau d'alarme</TableCell>
                    <TableCell>Sites concernés</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>admin@iam.ma</TableCell>
                    <TableCell>Tous</TableCell>
                    <TableCell>Tous</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>superviseur@iam.ma</TableCell>
                    <TableCell>Critique, Majeure</TableCell>
                    <TableCell>Tous</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SMS</TableCell>
                    <TableCell>+212612345678</TableCell>
                    <TableCell>Critique</TableCell>
                    <TableCell>Tous</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>
                        Éditer
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Container>
  );
}


export default ConfigurationView;