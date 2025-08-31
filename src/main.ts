import { ApiExecutionEngine } from "./execution/ApiExecutionEngine";
import { ApiEndpoint } from "./models/ApiEndpoint";
import { ExecutionOptions } from "./models/ExecutionOptions";
import { AOAI } from "./ai/AOAI";

const aoai = new AOAI();

(async () => {

  const response = await aoai.chat("Why is the sky blue ?");

  console.log(response);

  // Initialize the execution engine
  const engine = new ApiExecutionEngine(aoai);

  // ADD connection validation before execution
  console.log('🔍 Validating connections...\n');

  // 1. Create Get All Products Endpoint
  const getProductsEndpoint = new ApiEndpoint({
    id: 'get-products',
    name: 'Get All Products',
    method: 'GET',
    baseUrl: 'https://fakestoreapi.com',
    path: '/products',
    expectedResponse: [{
      statusCode: 200,
      body: {
        products: { name: 'products', type: 'array', required: true }
      }
    }],
    naturalLanguageInput: 'Get all products from the store'
  });

  // 3. Create Get Single Product Endpoint
  const getProductEndpoint = new ApiEndpoint({
    id: 'get-product',
    name: 'Get Product by ID',
    method: 'GET',
    baseUrl: 'https://fakestoreapi.com',
    path: '/products/{id}',
    pathParams: {
      id: { name: 'id', type: 'number', required: true, defaultValue: 1 }
    },
    expectedResponse: [{
      statusCode: 200,
      body: {
        id: { name: 'id', type: 'number', required: true },
        title: { name: 'title', type: 'string', required: true },
        price: { name: 'price', type: 'number', required: true }
      }
    }],
    naturalLanguageInput: 'Get the product with id of first product'
  });

  // Type-safe connections using the new API
  getProductEndpoint.addTypedConnection(
    getProductsEndpoint.getResponseProperty('0.id'),
    getProductEndpoint.getPathProperty('id'),
    'Use the ID of the first product'
  );

  // 4. Create New Product Endpoint
  const createProductEndpoint = new ApiEndpoint({
    id: 'create-product',
    name: 'Create New Product',
    method: 'POST',
    baseUrl: 'https://fakestoreapi.com',
    path: '/products',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      type: 'json',
      schema: {
        title: { name: 'title', type: 'string', required: true },
        price: { name: 'price', type: 'number', required: true },
        description: { name: 'description', type: 'string', required: true },
        category: { name: 'category', type: 'string', required: true },
        image: { name: 'image', type: 'string', required: true }
      }
    },
    expectedResponse: [{
      statusCode: 201,
      body: {
        id: { name: 'id', type: 'number', required: true }
      }
    }],
    naturalLanguageInput: `
    Create a new electronics product called "Smart Watch Pro" priced at $299.99
    The product should have the following attributes:
    - Title: Smart Watch Pro
    - Price: 299.99
    - Description: Advanced fitness tracking smartwatch
    - Category: electronics
    - Image: https://fakestoreapi.com/img/watch.jpg
    `
  });

  // 5. Create Shopping Cart Endpoint
  const createCartEndpoint = new ApiEndpoint({
    id: 'create-cart',
    name: 'Create Shopping Cart',
    method: 'POST',
    baseUrl: 'https://fakestoreapi.com',
    path: '/carts',
    body: {
      type: 'json',
      schema: {
        userId: { name: 'userId', type: 'number', required: true },
        products: {
          name: 'products',
          type: 'array',
          required: true,
          items: { name: 'product-id', type: 'number', required: true }
        }
      }
    },
    expectedResponse: [{
      statusCode: 201,
      body: {
        id: { name: 'id', type: 'number', required: true }
      }
    }],
    naturalLanguageInput: 'Create a cart for user 1 with the new product'
  });

  // Connect product ID to cart
  createCartEndpoint.addTypedConnection(
    createProductEndpoint.getResponseProperty('id'),
    createCartEndpoint.getBodyProperty('products.0'),
    'Add the newly created product to the cart'
  );

  // 6. Update Product Endpoint
  const updateProductEndpoint = new ApiEndpoint({
    id: 'update-product',
    name: 'Update Product',
    method: 'PUT',
    baseUrl: 'https://fakestoreapi.com',
    path: '/products/{id}',
    pathParams: {
      id: { name: 'id', type: 'number', required: true }
    },
    body: {
      type: 'json',
      schema: {
        title: { name: 'title', type: 'string', required: true },
        price: { name: 'price', type: 'number', required: true }
      }
    },
    expectedResponse: [{
      statusCode: 200,
      body: {
        id: { name: 'id', type: 'number', required: true }
      }
    }],
    naturalLanguageInput: 'Update the Smart Watch price to $279.99'
  });

  // AI mapping for product update
  updateProductEndpoint.updateAiMapping({
    input: 'Update the Smart Watch price to $279.99',
    resolvedBody: {
      title: 'Smart Watch Pro',
      price: 279.99,
      description: 'Advanced fitness tracking smartwatch',
      category: 'electronics',
      image: 'https://fakestoreapi.com/img/watch.jpg'
    },
    confidence: 0.90
  });

  // Connect product ID for update
  updateProductEndpoint.addTypedConnection(
    createProductEndpoint.getIdProperty(),
    updateProductEndpoint.getPathProperty('id'),
    'Update the product that was created'
  );

  // 7. Delete Product Endpoint
  const deleteProductEndpoint = new ApiEndpoint({
    id: 'delete-product',
    name: 'Delete Product',
    method: 'DELETE',
    baseUrl: 'https://fakestoreapi.com',
    path: '/products/{id}',
    pathParams: {
      id: { name: 'id', type: 'number', required: true }
    },
    expectedResponse: [{
      statusCode: 200
    }],
    naturalLanguageInput: 'Delete the created product'
  });

  // Connect product ID for deletion
  deleteProductEndpoint.addTypedConnection(
    createProductEndpoint.getIdProperty(),
    deleteProductEndpoint.getPathProperty('id'),
    'Delete the product that was created'
  );

  // Collect all endpoints
  const endpoints = [
    getProductsEndpoint,
    getProductEndpoint,
    createProductEndpoint,
    createCartEndpoint,
    updateProductEndpoint,
    deleteProductEndpoint
  ];

  // Execution options
  const options: ExecutionOptions = {
    timeout: 10000,
    retries: 2,
    validateResponse: true,
    continueOnError: false
  };

  // Execute the flow
  console.log('🚀 Starting FakeStore API Test Flow...\n');

  const results = await engine.executeFlow(endpoints, options);

  // Process results
  console.log('📊 Execution Results:\n');

  results.forEach((result, index) => {
    const endpoint = endpoints.find(ep => ep.id === result.endpointId);
    const status = result.success ? '✅' : '❌';

    console.log(`${index + 1}. ${status} ${endpoint?.name}`);
    console.log(`   Endpoint: ${result.requestData.method} ${result.requestData.url}`);
    console.log(`   Status: ${result.statusCode} | Time: ${result.responseTime}ms`);

    if (result.success && result.responseData.body) {
      const bodyPreview = JSON.stringify(result.responseData.body).slice(0, 100);
      console.log(`   Response: ${bodyPreview}${bodyPreview.length >= 100 ? '...' : ''}`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    console.log('');
  });

  // Show context summary
  const context = engine.getContext();
  const successCount = Array.from(context.results.values()).filter(r => r.success).length;

  console.log('🔗 Execution Summary:');
  console.log(`- Total endpoints: ${endpoints.length}`);
  console.log(`- Successful: ${successCount}`);
  console.log(`- Failed: ${endpoints.length - successCount}`);

  // Example of manual single endpoint execution
  console.log('\n🔍 Manual Single Endpoint Example:');

  const singleEndpoint = new ApiEndpoint({
    id: 'manual-get-user',
    name: 'Get User by ID',
    method: 'GET',
    baseUrl: 'https://fakestoreapi.com',
    path: '/users/{id}',
    pathParams: {
      id: { name: 'id', type: 'number', required: true, defaultValue: 1 }
    }
  });

  const singleResult = await engine.executeEndpoint(singleEndpoint, { timeout: 5000 });

  if (singleResult.success) {
    console.log('✅ Single endpoint success');
    console.log(`User: ${singleResult.responseData.body.username}`);
    console.log(`Email: ${singleResult.responseData.body.email}`);
  } else {
    console.log('❌ Single endpoint failed:', singleResult.error);
  }

  // Clear context for cleanup
  engine.clearContext();

  console.log('\n✨ Test flow completed!');
})();