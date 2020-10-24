import store from 'store-js';
import gql from 'graphql-tag';
import { useState, useEffect } from "react";
import { Banner, Card, Form, FormLayout, Frame, Layout, Page, PageActions, TextField, Toast } from '@shopify/polaris';
import { useMutation } from 'react-apollo';


const Create_product = gql`
mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        vendor
        title
        description
        variants(first:1){
          edges{
            node{
              price
              compareAtPrice
            }
          }
        }
      }
          
      userErrors {
        field
        message
      }
    }
  }
  
`;

const CreateNewProduct = () => {
    const [title, setTitle] = useState("")
    const [name, setName] = useState('')
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [compareAtPrice, setCompareAtPrice] = useState("")
    const [showToast, setShowToast] = useState(false)
    const [handleSubmit, { error, data }] = useMutation(Create_product)
    const handleNewProductTitle = () => {
        return (value) => setTitle(value)
    };

    const handleNewProductDescription = () => {
        return (value) => setDescription(value)
    };

    const handleNewProductPrice = () => {
        return (value) => setPrice(value)
    };

    const handleNewProductCompareAtPrice = () => {
        return (value) => setCompareAtPrice(value)
    };



    const initialize = () => {
        const item = store.get('item');
        const name = item.title;
        const price = item.product.variants.edges[0].node.price;
        const compareAtPrice = item.product.variants.edges[0].node.compareAtPrice;
        const description = item.product.description;
        const title = item.product.title;
        setPrice(price);
        setCompareAtPrice(compareAtPrice);
        setDescription(description);
        setTitle(title);
        setName(name);
    };

    useEffect(() => {
        initialize();
    }, [])

    const renderError = error && (
        <Banner status="critical">{error.message}</Banner>
    );
    const renderToast = showToast && data(
        <Toast
            content="Sucessfully updated"
            onDismiss={() => setShowToast(false)}
        />
    );
    return (
        <Frame>
            <Page>
                <Layout>
                    {renderToast}
                    <Layout.Section>
                        {renderError}
                    </Layout.Section>
                    <Layout.Section>
                        <Form>
                            <Card title={name} sectioned>
                                <FormLayout>
                                    <FormLayout.Group>
                                        <TextField
                                            value={title}
                                            onChange={handleNewProductTitle()}
                                            disabled={false}
                                            label="Product Title"
                                            type="title"
                                        />
                                        <TextField
                                            value={description}
                                            onChange={handleNewProductDescription()}
                                            label="Product Description"
                                            type="description"
                                        />
                                        <TextField
                                            value={price}
                                            onChange={handleNewProductPrice()}
                                            disabled={false}
                                            label="Product Price"
                                            type="price"
                                        />
                                        <TextField
                                            value={compareAtPrice}
                                            onChange={handleNewProductCompareAtPrice()}
                                            label="Product Compare At Price"
                                            type="compareatprice"
                                        />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Card>
                            <PageActions
                                primaryAction={[
                                    {
                                        content: 'Save',
                                        onAction: () => {
                                            const productVariableInput = {
                                                title: "This is Demo Product",
                                                descriptionHtml: "<p>This is the description for the product</p>",
                                                variants: {
                                                    price: 1000,
                                                    compareAtPrice: 3000
                                                }

                                            };
                                            handleSubmit({
                                                variables: { input: productVariableInput },
                                            });
                                            setShowToast(true)
                                        }
                                    }
                                ]}
                            />
                        </Form>
                    </Layout.Section>
                </Layout>
            </Page>
        </Frame>
    );
}

export default CreateNewProduct;