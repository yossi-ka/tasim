import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Checkbox,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip,
} from "@mui/material";
import {
    Person as PersonIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Save as SaveIcon,
    ExpandMore as ExpandMoreIcon,
    Inventory as InventoryIcon,
    Assignment as AssignmentIcon,
    Check as CheckIcon,
    SelectAll as SelectAllIcon,
    Clear as ClearIcon,
} from "@mui/icons-material";

import { useQuery, useMutation, useQueryClient } from "react-query";
import { getCollectionGroupProducts, saveEmployeeProductAssignments } from "../../../api/services/collectionGroups";
import { getAllemployees } from "../../../api/services/employees";

// Product Component
const ProductItem = ({
    product,
    isSelected,
    onToggleSelect,
    onAssignToEmployee,
    employees,
    showEmployeeSelect,
    onToggleEmployeeSelect,
    currentEmployeeId
}) => {
    const handleKeyDown = (event) => {
        if (!showEmployeeSelect) return;

        event.preventDefault();
        const activeEmployees = employees.filter(emp => emp.isActive);
        const currentIndex = activeEmployees.findIndex(emp => emp.id === currentEmployeeId);

        if (event.key === 'ArrowDown') {
            const nextIndex = (currentIndex + 1) % activeEmployees.length;
            onAssignToEmployee(activeEmployees[nextIndex].id);
        } else if (event.key === 'ArrowUp') {
            const prevIndex = currentIndex === 0 ? activeEmployees.length - 1 : currentIndex - 1;
            onAssignToEmployee(activeEmployees[prevIndex].id);
        } else if (event.key === 'Enter') {
            onToggleEmployeeSelect();
        } else if (event.key === 'Escape') {
            onToggleEmployeeSelect();
        }
    };

    return (
        <ListItem
            sx={{
                border: showEmployeeSelect ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                '&:hover': {
                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                },
                position: 'relative',
                ...(showEmployeeSelect && {
                    boxShadow: '0 0 10px rgba(25, 118, 210, 0.3)',
                    '&::before': {
                        content: '"◀"',
                        position: 'absolute',
                        left: -10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#1976d2',
                        fontSize: '20px',
                        fontWeight: 'bold'
                    }
                })
            }}
        >
            <Checkbox
                checked={isSelected}
                onChange={onToggleSelect}
                sx={{ mr: 1 }}
            />

            <ListItemText
                primary={product.productName}
                secondary={`כמות: ${product.quantityOrWeight}`}
            />

            <ListItemSecondaryAction>
                {showEmployeeSelect ? (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={currentEmployeeId || ''}
                            onChange={(e) => onAssignToEmployee(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            displayEmpty
                        >
                            <MenuItem value="">ביטול שיוך</MenuItem>
                            {employees.filter(emp => emp.isActive).map((employee) => (
                                <MenuItem key={employee.id} value={employee.id}>
                                    {employee.firstName} {employee.lastName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <Tooltip title="שיוך לעובד">
                        <IconButton
                            edge="end"
                            onClick={onToggleEmployeeSelect}
                            size="small"
                            color="primary"
                        >
                            <CheckIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </ListItemSecondaryAction>
        </ListItem>
    );
};

const EmployeeProducts = ({ currentCollectionGroup }) => {
    const [products, setProducts] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [activeProductSelect, setActiveProductSelect] = useState(null);
    const queryClient = useQueryClient();

    const collectionProducts = useQuery(
        ['collectionGroupProducts', currentCollectionGroup?.id],
        () => getCollectionGroupProducts(currentCollectionGroup?.id),
        {
            enabled: !!currentCollectionGroup?.id,
            refetchOnWindowFocus: false
        }
    );

    const employees = useQuery(['employees'], getAllemployees);

    // Initialize products state
    useEffect(() => {
        if (collectionProducts.data) {
            // Just set the products array directly with assignedEmployeeId field
            setProducts(collectionProducts.data.map(product => ({
                ...product,
                assignedEmployeeId: product.assignedEmployeeId || null
            })));
        }
    }, [collectionProducts.data]);

    // Get products by employee or unassigned
    const getProductsByEmployee = (employeeId) => {
        if (employeeId === 'unassigned') {
            return products.filter(product => !product.assignedEmployeeId);
        }
        return products.filter(product => product.assignedEmployeeId === employeeId);
    };

    // Calculate total quantity for an employee
    const calculateTotalQuantity = (employeeId) => {
        return getProductsByEmployee(employeeId).reduce((total, product) => {
            return total + (product.quantityOrWeight || 0);
        }, 0);
    };

    // Assign product to employee
    const assignProduct = (productId, employeeId) => {
        setProducts(prev => prev.map(product =>
            product.id === productId
                ? { ...product, assignedEmployeeId: employeeId || null }
                : product
        ));
        setHasChanges(true);
    };

    // Toggle product selection
    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    // Select all unassigned products
    const selectAllUnassigned = () => {
        const unassignedIds = getProductsByEmployee('unassigned').map(p => p.id);
        setSelectedProducts(new Set(unassignedIds));
    };

    // Clear all selections
    const clearSelection = () => {
        setSelectedProducts(new Set());
    };

    // Assign selected products to employee
    const assignSelectedProducts = (employeeId) => {
        const selectedProductsList = Array.from(selectedProducts);
        selectedProductsList.forEach(productId => {
            assignProduct(productId, employeeId);
        });
        clearSelection();
    };

    // Handle product assignment from dropdown
    const handleProductAssignment = (productId, employeeId) => {
        assignProduct(productId, employeeId);

        // Always move to next unassigned product after assignment (if assigned to someone)
        if (employeeId) {
            const unassignedProducts = getProductsByEmployee('unassigned');
            const currentIndex = unassignedProducts.findIndex(p => p.id === productId);

            // Get the product at the same index after the current one is removed
            // If we assigned the last product, there won't be a next one
            const nextProduct = unassignedProducts[currentIndex + 1] || unassignedProducts[currentIndex];

            if (nextProduct && nextProduct.id !== productId) {
                setActiveProductSelect(nextProduct.id);
            } else {
                setActiveProductSelect(null);
            }
        } else {
            setActiveProductSelect(null);
        }
    };

    // Save changes
    const saveProductAssignments = useMutation(
        () => saveEmployeeProductAssignments(currentCollectionGroup.id, products),
        {
            onSuccess: () => {
                setHasChanges(false);
                queryClient.invalidateQueries(['collectionGroupProducts', currentCollectionGroup?.id]);
            },
            onError: (error) => {
                console.error('Error saving assignments:', error);
            }
        }
    );

    const handleSave = async () => {
        saveProductAssignments.mutate();
    };

    if (collectionProducts.isLoading || employees.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (collectionProducts.error || employees.error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    שגיאה בטעינת הנתונים
                </Alert>
            </Box>
        );
    }
    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon sx={{ fontSize: 40 }} />
                            שיוך מוצרים לעובדים
                        </Typography>
                        {hasChanges && (
                            <Alert severity="warning" sx={{ py: 0.5, px: 1.5 }}>
                                יש שינויים שלא נשמרו!
                            </Alert>
                        )}
                    </Box>
                    {/* <Typography variant="body1" color="text.secondary">
                        סמן מספר מוצרים או השתמש בכפתור ✓ לשיוך מהיר
                    </Typography> */}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {selectedProducts.size > 0 && (
                        <>
                            <Chip
                                label={`${selectedProducts.size} נבחרו`}
                                color="primary"
                                onDelete={clearSelection}
                                deleteIcon={<ClearIcon />}
                            />
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>שיוך לעובד</InputLabel>
                                <Select
                                    value=""
                                    onChange={(e) => assignSelectedProducts(e.target.value)}
                                    displayEmpty
                                >
                                    {employees.data?.filter(emp => emp.isActive).map((employee) => (
                                        <MenuItem key={employee.id} value={employee.id}>
                                            {employee.firstName} {employee.lastName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    )}

                    <Button
                        variant="contained"
                        startIcon={saveProductAssignments.isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={!hasChanges || saveProductAssignments.isLoading}
                        // size="large"
                    >
                        {saveProductAssignments.isLoading ? 'שומר...' : 'שמור שינויים'}
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Unassigned Products */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: 'fit-content' }}>
                        <CardHeader
                            avatar={
                                <Badge max={999} badgeContent={getProductsByEmployee('unassigned').length} color="primary">
                                    <InventoryIcon />
                                </Badge>
                            }
                            title="מוצרים לא משויכים"
                            subheader={`סה"כ כמות: ${calculateTotalQuantity('unassigned')}`}
                            action={
                                getProductsByEmployee('unassigned').length > 0 && (
                                    <Tooltip title="בחר הכל">
                                        <IconButton onClick={selectAllUnassigned}>
                                            <SelectAllIcon />
                                        </IconButton>
                                    </Tooltip>
                                )
                            }
                        />
                        <CardContent>
                            <Box sx={{ maxHeight: '52vh', overflow: 'auto' }}>
                                {getProductsByEmployee('unassigned').length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                        כל המוצרים משויכים
                                    </Typography>
                                ) : (
                                    <List dense>
                                        {getProductsByEmployee('unassigned').map((product) => (
                                            <ProductItem
                                                key={product.id}
                                                product={product}
                                                isSelected={selectedProducts.has(product.id)}
                                                onToggleSelect={() => toggleProductSelection(product.id)}
                                                onAssignToEmployee={(employeeId) => handleProductAssignment(product.id, employeeId)}
                                                employees={employees.data || []}
                                                showEmployeeSelect={activeProductSelect === product.id}
                                                onToggleEmployeeSelect={() => setActiveProductSelect(
                                                    activeProductSelect === product.id ? null : product.id
                                                )}
                                                currentEmployeeId={null}
                                            />
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Employees */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {employees.data?.filter(emp => emp.isActive).map((employee) => (
                            <Card key={employee.id}>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <PersonIcon />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6">
                                                    {employee.firstName} {employee.lastName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {employee.username}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Chip
                                                    label={`${getProductsByEmployee(employee.id).length} מוצרים`}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`כמות: ${calculateTotalQuantity(employee.id)}`}
                                                    color="secondary"
                                                />
                                            </Box>
                                        </Box>
                                    </AccordionSummary>                                        <AccordionDetails>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {getProductsByEmployee(employee.id).length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                    אין מוצרים משויכים לעובד זה
                                                </Typography>
                                            ) : (
                                                <List dense>
                                                    {getProductsByEmployee(employee.id).map((product) => (
                                                        <ProductItem
                                                            key={product.id}
                                                            product={product}
                                                            isSelected={selectedProducts.has(product.id)}
                                                            onToggleSelect={() => toggleProductSelection(product.id)}
                                                            onAssignToEmployee={(employeeId) => handleProductAssignment(product.id, employeeId)}
                                                            employees={employees.data || []}
                                                            showEmployeeSelect={activeProductSelect === product.id}
                                                            onToggleEmployeeSelect={() => setActiveProductSelect(
                                                                activeProductSelect === product.id ? null : product.id
                                                            )}
                                                            currentEmployeeId={employee.id}
                                                        />
                                                    ))}
                                                </List>
                                            )}
                                        </Box>

                                        {/* Quick assign selected products */}
                                        {selectedProducts.size > 0 && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => assignSelectedProducts(employee.id)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    שיוך {selectedProducts.size} מוצרים נבחרים
                                                </Button>
                                            </>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            </Card>
                        ))}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EmployeeProducts;
